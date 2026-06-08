//! # Stellar Pass Escrow Contract
//!
//! Secondary ticket marketplace with automatic royalty splitting
//! and organizer-enforced price caps.
//!
//! ## Flow
//! Seller lists ticket → held in escrow
//! Buyer purchases → payment split (royalty + seller proceeds)
//! Seller cancels → ticket returned

#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env, Vec};

// ---------------------------------------------------------------------------
// Cross-contract interfaces
// ---------------------------------------------------------------------------

/// Minimal interface for the Stellar Pass Ticket contract.
#[soroban_sdk::contractclient(name = "TicketClient")]
pub trait TicketTrait {
    fn transfer(env: Env, from: Address, to: Address, token_id: u128);
    fn get_metadata(env: Env, ticket_id: u128) -> TicketMetadataStub;
    fn owner_of(env: Env, token_id: u128) -> Address;
}

/// Minimal interface for Soroban token contracts.
#[soroban_sdk::contractclient(name = "TokenClient")]
pub trait TokenTrait {
    fn transfer(env: Env, from: Address, to: Address, amount: i128);
}

/// Lightweight stub of TicketMetadata for escrow validation.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct TicketMetadataStub {
    pub event_id: Bytes,
    pub tier: soroban_sdk::String,
    pub event_date: u64,
    pub venue: soroban_sdk::String,
    pub image_url: soroban_sdk::String,
    pub is_transferable: bool,
    pub resale_price_cap: i128,
    pub status: TicketStatusStub,
}

/// Ticket status for cross-contract verification.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum TicketStatusStub {
    Active,
    Used,
    Frozen,
    ClawedBack,
}

// ---------------------------------------------------------------------------
// Escrow data types
// ---------------------------------------------------------------------------

/// Status of a resale listing.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
}

/// A ticket resale listing in the escrow marketplace.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Listing {
    pub listing_id: u128,
    pub seller: Address,
    pub ticket_contract: Address,
    pub ticket_id: u128,
    pub ask_price: i128,
    pub currency: Address,
    /// Royalty in basis points (e.g., 500 = 5%).
    pub royalty_bps: u32,
    /// Maximum resale price allowed by organizer. 0 = no cap.
    pub price_cap: i128,
    pub status: ListingStatus,
    pub event_id: Bytes,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Listing(u128),
    ListingCount,
    ListingsByEvent(Bytes), // Vec<u128>
    TokenBalance(Address),  // used by mock token in tests
    TicketOwner(u128),      // used by mock ticket in tests
    Ticket(u128),           // used by mock ticket in tests
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("contract not initialized")
}

fn next_listing_id(env: &Env) -> u128 {
    let count: u128 = env
        .storage()
        .instance()
        .get(&DataKey::ListingCount)
        .unwrap_or(0);
    let next = count + 1;
    env.storage().instance().set(&DataKey::ListingCount, &next);
    next
}

fn add_listing_to_event_index(env: &Env, event_id: &Bytes, listing_id: u128) {
    let key = DataKey::ListingsByEvent(event_id.clone());
    let mut listings: Vec<u128> = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or(Vec::new(env));
    listings.push_back(listing_id);
    env.storage().persistent().set(&key, &listings);
}

fn get_listings_for_event(env: &Env, event_id: &Bytes) -> Vec<u128> {
    let key = DataKey::ListingsByEvent(event_id.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(Vec::new(env))
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct StellarPassEscrow;

#[contractimpl]
impl StellarPassEscrow {
    /// Initialize the escrow contract with an admin (organizer platform) address.
    pub fn initialize(env: Env, admin: Address) {
        assert!(
            !env.storage().instance().has(&DataKey::Admin),
            "already initialized"
        );
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ListingCount, &0u128);
    }

    /// Create a resale listing for a ticket.
    ///
    /// 1. Validates ask_price <= ticket's resale_price_cap
    /// 2. Transfers ticket from seller into escrow custody
    /// 3. Stores the listing
    pub fn create_listing(
        env: Env,
        seller: Address,
        ticket_contract: Address,
        ticket_id: u128,
        ask_price: i128,
        currency: Address,
        royalty_bps: u32,
    ) -> u128 {
        seller.require_auth();
        assert!(ask_price > 0, "ask price must be positive");
        assert!(royalty_bps <= 10_000, "royalty bps exceeds 100%");

        // Cross-contract: get ticket metadata to validate price cap
        let ticket_client = TicketClient::new(&env, &ticket_contract);
        let metadata = ticket_client.get_metadata(&ticket_id);

        assert!(
            metadata.status == TicketStatusStub::Active,
            "ticket is not active"
        );
        assert!(metadata.is_transferable, "ticket is not transferable");

        // Validate price cap (0 = no cap)
        let price_cap = metadata.resale_price_cap;
        if price_cap > 0 {
            assert!(ask_price <= price_cap, "ask price exceeds resale cap");
        }

        // Cross-contract: transfer ticket from seller to this escrow contract
        let escrow_address = env.current_contract_address();
        ticket_client.transfer(&seller, &escrow_address, &ticket_id);

        // Create and store listing
        let listing_id = next_listing_id(&env);
        let listing = Listing {
            listing_id,
            seller: seller.clone(),
            ticket_contract: ticket_contract.clone(),
            ticket_id,
            ask_price,
            currency: currency.clone(),
            royalty_bps,
            price_cap,
            status: ListingStatus::Active,
            event_id: metadata.event_id.clone(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Listing(listing_id), &listing);

        // Index by event
        add_listing_to_event_index(&env, &metadata.event_id, listing_id);

        listing_id
    }

    /// Buy a listed ticket.
    ///
    /// 1. Buyer pays seller (ask_price minus royalty)
    /// 2. Royalty goes to admin/organizer
    /// 3. Ticket transferred from escrow to buyer
    pub fn buy(env: Env, buyer: Address, listing_id: u128) {
        buyer.require_auth();

        let mut listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found");

        assert!(listing.status == ListingStatus::Active, "listing not active");
        assert!(buyer != listing.seller, "buyer cannot be seller");

        let admin = get_admin(&env);

        // Calculate royalty split
        let royalty_amount: i128 =
            (listing.ask_price * listing.royalty_bps as i128) / 10_000;
        let seller_amount: i128 = listing.ask_price - royalty_amount;

        // Transfer payment from buyer to seller
        let token_client = TokenClient::new(&env, &listing.currency);
        token_client.transfer(&buyer, &listing.seller, &seller_amount);

        // Transfer royalty to organizer if there is one
        if royalty_amount > 0 {
            token_client.transfer(&buyer, &admin, &royalty_amount);
        }

        // Transfer ticket from escrow to buyer
        let ticket_client = TicketClient::new(&env, &listing.ticket_contract);
        let escrow_address = env.current_contract_address();
        ticket_client.transfer(&escrow_address, &buyer, &listing.ticket_id);

        // Update listing
        listing.status = ListingStatus::Sold;
        env.storage()
            .persistent()
            .set(&DataKey::Listing(listing_id), &listing);
    }

    /// Cancel a listing and return the ticket to the seller.
    pub fn cancel_listing(env: Env, seller: Address, listing_id: u128) {
        seller.require_auth();

        let mut listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found");

        assert!(listing.status == ListingStatus::Active, "listing not active");
        assert!(listing.seller == seller, "not the seller");

        // Transfer ticket back to seller
        let ticket_client = TicketClient::new(&env, &listing.ticket_contract);
        let escrow_address = env.current_contract_address();
        ticket_client.transfer(&escrow_address, &seller, &listing.ticket_id);

        listing.status = ListingStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Listing(listing_id), &listing);
    }

    /// Get a listing by ID.
    pub fn get_listing(env: Env, listing_id: u128) -> Listing {
        env.storage()
            .persistent()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found")
    }

    /// Get all active listings for a given event.
    pub fn get_active_listings(env: Env, event_id: Bytes) -> Vec<Listing> {
        let listing_ids = get_listings_for_event(&env, &event_id);
        let mut active: Vec<Listing> = Vec::new(&env);

        for id in listing_ids.iter() {
            if let Some(listing) = env
                .storage()
                .persistent()
                .get::<DataKey, Listing>(&DataKey::Listing(id))
            {
                if listing.status == ListingStatus::Active {
                    active.push_back(listing);
                }
            }
        }

        active
    }
}

// ---------------------------------------------------------------------------
// Mock contracts for testing (in separate modules to avoid #[contractimpl] conflicts)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod mock_ticket {
    use soroban_sdk::{contract, contractimpl, Address, Env};
    use crate::{DataKey, TicketMetadataStub};

    #[contract]
    pub struct MockTicket;

    #[contractimpl]
    impl MockTicket {
        pub fn initialize(env: Env, admin: Address) {
            env.storage().instance().set(&DataKey::Admin, &admin);
        }

        pub fn mint(env: Env, to: Address, ticket_id: u128, metadata: TicketMetadataStub) {
            env.storage()
                .persistent()
                .set(&DataKey::Ticket(ticket_id), &metadata);
            env.storage()
                .persistent()
                .set(&DataKey::TicketOwner(ticket_id), &to);
        }

        pub fn transfer(env: Env, from: Address, to: Address, ticket_id: u128) {
            from.require_auth();
            let owner: Address = env
                .storage()
                .persistent()
                .get(&DataKey::TicketOwner(ticket_id))
                .expect("ticket not found");
            assert!(owner == from, "not owner");
            env.storage()
                .persistent()
                .set(&DataKey::TicketOwner(ticket_id), &to);
        }

        pub fn get_metadata(env: Env, ticket_id: u128) -> TicketMetadataStub {
            env.storage()
                .persistent()
                .get(&DataKey::Ticket(ticket_id))
                .expect("ticket not found")
        }

        pub fn owner_of(env: Env, ticket_id: u128) -> Address {
            env.storage()
                .persistent()
                .get(&DataKey::TicketOwner(ticket_id))
                .expect("ticket not found")
        }
    }
}

#[cfg(test)]
mod mock_token {
    use soroban_sdk::{contract, contractimpl, Address, Env};
    use crate::DataKey;

    #[contract]
    pub struct MockToken;

    #[contractimpl]
    impl MockToken {
        pub fn initialize(env: Env, admin: Address, supply: i128) {
            env.storage().instance().set(&DataKey::Admin, &admin);
            env.storage().instance().set(&"supply", &supply);
        }

        pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
            from.require_auth();
            let from_bal: i128 = env
                .storage()
                .persistent()
                .get(&DataKey::TokenBalance(from.clone()))
                .unwrap_or(0);
            assert!(from_bal >= amount, "insufficient balance");
            env.storage()
                .persistent()
                .set(&DataKey::TokenBalance(from), &(from_bal - amount));
            let to_bal: i128 = env
                .storage()
                .persistent()
                .get(&DataKey::TokenBalance(to.clone()))
                .unwrap_or(0);
            env.storage()
                .persistent()
                .set(&DataKey::TokenBalance(to), &(to_bal + amount));
        }

        pub fn mint_to(env: Env, to: Address, amount: i128) {
            let bal: i128 = env
                .storage()
                .persistent()
                .get(&DataKey::TokenBalance(to.clone()))
                .unwrap_or(0);
            env.storage()
                .persistent()
                .set(&DataKey::TokenBalance(to), &(bal + amount));
        }

        pub fn balance(env: Env, account: Address) -> i128 {
            env.storage()
                .persistent()
                .get(&DataKey::TokenBalance(account))
                .unwrap_or(0)
        }
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use super::mock_ticket::*;
    use super::mock_token::*;
    use soroban_sdk::{testutils::Address as _, Address, Bytes, Env, String};

    fn setup(env: &Env) -> (Address, Address, Address, Address, Address) {
        let admin = Address::generate(env);
        let seller = Address::generate(env);
        let buyer = Address::generate(env);

        // Deploy mock ticket contract
        let ticket_contract_id = env.register_contract(None, MockTicket);
        let ticket_admin = Address::generate(env);
        let mock_ticket = MockTicketClient::new(env, &ticket_contract_id);
        mock_ticket.initialize(&ticket_admin);

        // Deploy mock token contract
        let token_contract_id = env.register_contract(None, MockToken);
        let mock_token = MockTokenClient::new(env, &token_contract_id);
        mock_token.initialize(&admin, &1_000_000_000i128);

        // Deploy escrow contract
        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(env, &escrow_id);
        escrow.initialize(&admin);

        (admin, seller, buyer, ticket_contract_id, token_contract_id)
    }

    fn sample_ticket_metadata(env: &Env) -> TicketMetadataStub {
        TicketMetadataStub {
            event_id: Bytes::from_array(env, &[0xAA, 0xBB]),
            tier: String::from_str(env, "GA"),
            event_date: 1700000000u64,
            venue: String::from_str(env, "Venue"),
            image_url: String::from_str(env, "https://img"),
            is_transferable: true,
            resale_price_cap: 500_000_000i128,
            status: TicketStatusStub::Active,
        }
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let _escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        _escrow.initialize(&admin);

        // Verify admin is set by checking we can call admin-gated functions
        // (just ensuring it initialized without panic)
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice_panics() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);
        escrow.initialize(&admin);
    }

    #[test]
    fn test_create_listing() {
        let env = Env::default();
        let (admin, seller, _buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        // Mint ticket to seller
        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        // Create listing using the escrow from setup
        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        let listing_id = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &400_000_000i128,
            &token_contract_id,
            &500u32,
        );

        let listing = escrow.get_listing(&listing_id);
        assert_eq!(listing.listing_id, listing_id);
        assert_eq!(listing.seller, seller);
        assert_eq!(listing.ask_price, 400_000_000i128);
        assert_eq!(listing.royalty_bps, 500u32);
        assert_eq!(listing.status, ListingStatus::Active);

        // Ticket should now be owned by escrow
        let ticket_owner = mock_ticket.owner_of(&1u128);
        assert_eq!(ticket_owner, escrow_id);
    }

    #[test]
    #[should_panic(expected = "ask price exceeds resale cap")]
    fn test_create_listing_price_exceeds_cap() {
        let env = Env::default();
        let (admin, seller, _buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        // Ask price 600M exceeds cap of 500M
        escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &600_000_000i128,
            &token_contract_id,
            &500u32,
        );
    }

    #[test]
    #[should_panic(expected = "ask price must be positive")]
    fn test_create_listing_zero_price() {
        let env = Env::default();
        let (admin, seller, _buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &0i128,
            &token_contract_id,
            &500u32,
        );
    }

    #[test]
    fn test_cancel_listing() {
        let env = Env::default();
        let (admin, seller, _buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        let listing_id = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &300_000_000i128,
            &token_contract_id,
            &500u32,
        );

        escrow.cancel_listing(&seller, &listing_id);

        let listing = escrow.get_listing(&listing_id);
        assert_eq!(listing.status, ListingStatus::Cancelled);

        // Ticket returned to seller
        assert_eq!(mock_ticket.owner_of(&1u128), seller);
    }

    #[test]
    #[should_panic(expected = "not the seller")]
    fn test_cancel_listing_wrong_seller() {
        let env = Env::default();
        let (admin, seller, buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        let listing_id = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &300_000_000i128,
            &token_contract_id,
            &500u32,
        );

        // buyer tries to cancel — should fail
        escrow.cancel_listing(&buyer, &listing_id);
    }

    #[test]
    fn test_buy() {
        let env = Env::default();
        let (admin, seller, buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        // Setup: mint ticket to seller, give buyer tokens
        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        let mock_token = MockTokenClient::new(&env, &token_contract_id);
        mock_token.mint_to(&buyer, &1_000_000_000i128);

        // Create listing at 400M, royalty 5% (500 bps)
        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        let listing_id = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &400_000_000i128,
            &token_contract_id,
            &500u32,
        );

        // Buy
        escrow.buy(&buyer, &listing_id);

        // Verify listing sold
        let listing = escrow.get_listing(&listing_id);
        assert_eq!(listing.status, ListingStatus::Sold);

        // Verify ticket transferred to buyer
        assert_eq!(mock_ticket.owner_of(&1u128), buyer);

        // Verify payment split:
        // royalty = 400M * 500 / 10000 = 20M
        // seller receives = 400M - 20M = 380M
        assert_eq!(mock_token.balance(&seller), 380_000_000i128);
        assert_eq!(mock_token.balance(&admin), 20_000_000i128);
        // Buyer paid 400M from initial 1B
        assert_eq!(mock_token.balance(&buyer), 600_000_000i128);
    }

    #[test]
    #[should_panic(expected = "buyer cannot be seller")]
    fn test_buy_seller_is_buyer() {
        let env = Env::default();
        let (admin, seller, _buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        let listing_id = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &300_000_000i128,
            &token_contract_id,
            &500u32,
        );

        // Seller tries to buy own listing
        escrow.buy(&seller, &listing_id);
    }

    #[test]
    fn test_zero_royalty() {
        let env = Env::default();
        let (admin, seller, buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        let mock_token = MockTokenClient::new(&env, &token_contract_id);
        mock_token.mint_to(&buyer, &1_000_000_000i128);

        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        let listing_id = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &500_000_000i128,
            &token_contract_id,
            &0u32, // no royalty
        );

        escrow.buy(&buyer, &listing_id);

        // Seller gets full amount, admin gets nothing
        assert_eq!(mock_token.balance(&seller), 500_000_000i128);
        assert_eq!(mock_token.balance(&admin), 0);
    }

    #[test]
    fn test_get_active_listings() {
        let env = Env::default();
        let (admin, seller, _buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        let meta = sample_ticket_metadata(&env);

        // Mint 3 tickets
        mock_ticket.mint(&seller, &1u128, &meta);
        mock_ticket.mint(&seller, &2u128, &meta);
        mock_ticket.mint(&seller, &3u128, &meta);

        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        // Create 3 listings
        let _id1 = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &100_000_000i128,
            &token_contract_id,
            &500u32,
        );
        let id2 = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &2u128,
            &200_000_000i128,
            &token_contract_id,
            &500u32,
        );
        let _id3 = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &3u128,
            &300_000_000i128,
            &token_contract_id,
            &500u32,
        );

        // Cancel one
        escrow.cancel_listing(&seller, &id2);

        let event_id = Bytes::from_array(&env, &[0xAA, 0xBB]);
        let active = escrow.get_active_listings(&event_id);
        assert_eq!(active.len(), 2);
    }

    #[test]
    #[should_panic(expected = "listing not active")]
    fn test_buy_cancelled_listing() {
        let env = Env::default();
        let (admin, seller, buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        let listing_id = escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &300_000_000i128,
            &token_contract_id,
            &500u32,
        );

        escrow.cancel_listing(&seller, &listing_id);
        escrow.buy(&buyer, &listing_id);
    }

    #[test]
    #[should_panic(expected = "royalty bps exceeds 100%")]
    fn test_royalty_too_high() {
        let env = Env::default();
        let (admin, seller, _buyer, ticket_contract_id, token_contract_id) = setup(&env);

        env.mock_all_auths();

        let meta = sample_ticket_metadata(&env);
        let mock_ticket = MockTicketClient::new(&env, &ticket_contract_id);
        mock_ticket.mint(&seller, &1u128, &meta);

        let escrow_id = env.register_contract(None, StellarPassEscrow);
        let escrow = StellarPassEscrowClient::new(&env, &escrow_id);
        escrow.initialize(&admin);

        escrow.create_listing(
            &seller,
            &ticket_contract_id,
            &1u128,
            &300_000_000i128,
            &token_contract_id,
            &10_001u32, // > 100%
        );
    }
}
