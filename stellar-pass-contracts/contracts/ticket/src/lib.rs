//! # Stellar Pass Ticket Contract
//!
//! A Soroban smart contract implementing SEP-0048 compatible NFT tickets
//! for the Stellar Pass event ticketing platform.
//!
//! ## Features
//! - Mint unique ticket NFTs with rich metadata
//! - Transfer tickets with built-in transferability controls
//! - Freeze/unfreeze tickets to prevent transfers (anti-scalping)
//! - Clawback tickets to the issuer (refunds, fraud reversal)
//! - Burn tickets (permanent destruction)
//! - Mark tickets as used (check-in)

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Bytes, Env, String,
};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/// Status of a ticket in its lifecycle.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum TicketStatus {
    /// Ticket is active and can be used for entry or transferred.
    Active,
    /// Ticket has been used for check-in. Cannot be transferred.
    Used,
    /// Ticket is frozen by the organizer. Cannot be transferred.
    Frozen,
    /// Ticket has been reclaimed by the issuer (refund/fraud).
    ClawedBack,
}

/// On-chain metadata for a ticket NFT.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct TicketMetadata {
    /// Unique identifier for the event.
    pub event_id: Bytes,
    /// Ticket tier name (e.g., "General Admission", "VIP").
    pub tier: String,
    /// Event date as Unix timestamp (seconds).
    pub event_date: u64,
    /// Venue name or address.
    pub venue: String,
    /// URL to the ticket's display image.
    pub image_url: String,
    /// Whether this ticket can be transferred to another address.
    pub is_transferable: bool,
    /// Maximum resale price in stroops. 0 means no cap.
    pub resale_price_cap: i128,
    /// Current status of the ticket.
    pub status: TicketStatus,
}

/// Delegation approval for ticket transfers.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Approval {
    /// The address approved to transfer the ticket.
    pub approved: Address,
    /// Ledger number until which this approval is valid.
    pub live_until_ledger: u32,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

/// Internal storage key enum for the contract.
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// The admin address (event organizer).
    Admin,
    /// Ticket metadata indexed by token ID.
    Ticket(u128),
    /// Owner address indexed by token ID.
    Owner(u128),
    /// Token balance indexed by owner address.
    Balance(Address),
    /// Delegation approval indexed by token ID.
    Approval(u128),
    /// Total number of tickets minted.
    MintedCount,
    /// Collection name.
    Name,
    /// Collection symbol.
    Symbol,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Retrieve the admin address from instance storage. Panics if not initialized.
fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("contract not initialized")
}

/// Require that the caller is the admin. Panics otherwise.
fn require_admin(env: &Env) {
    let admin = get_admin(env);
    admin.require_auth();
}

fn get_balance(env: &Env, owner: &Address) -> u128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(owner.clone()))
        .unwrap_or(0)
}

fn set_balance(env: &Env, owner: &Address, balance: u128) {
    let key = DataKey::Balance(owner.clone());
    if balance == 0 {
        env.storage().persistent().remove(&key);
    } else {
        env.storage().persistent().set(&key, &balance);
    }
}

fn incr_balance(env: &Env, owner: &Address) -> u128 {
    let b = get_balance(env, owner) + 1;
    set_balance(env, owner, b);
    b
}

fn decr_balance(env: &Env, owner: &Address) -> u128 {
    let current = get_balance(env, owner);
    assert!(current > 0, "balance underflow");
    let b = current - 1;
    set_balance(env, owner, b);
    b
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

/// Stellar Pass Ticket NFT contract.
///
/// Implements SEP-0048 compatible NFT functionality with ticketing extensions:
/// freeze, clawback, burn, and usage tracking.
#[contract]
pub struct StellarPassTicket;

#[contractimpl]
impl StellarPassTicket {
    /// Initialize the contract with an admin address, name, and symbol.
    ///
    /// # Panics
    /// Panics if the contract is already initialized.
    pub fn initialize(env: Env, admin: Address, name: String, symbol: String) {
        assert!(
            !env.storage().instance().has(&DataKey::Admin),
            "already initialized"
        );
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::MintedCount, &0u128);
    }

    /// Mint a new ticket NFT.
    ///
    /// Creates a ticket with the given metadata and assigns it to `to`.
    /// Only the admin can mint tickets.
    ///
    /// # Panics
    /// * If called by non-admin
    /// * If a ticket with the given token_id already exists
    pub fn mint(env: Env, to: Address, token_id: u128, metadata: TicketMetadata) -> u128 {
        require_admin(&env);

        assert!(
            !env.storage()
                .persistent()
                .has(&DataKey::Ticket(token_id)),
            "ticket already exists"
        );

        env.storage()
            .persistent()
            .set(&DataKey::Ticket(token_id), &metadata);
        env.storage()
            .persistent()
            .set(&DataKey::Owner(token_id), &to);
        incr_balance(&env, &to);

        let count: u128 = env
            .storage()
            .instance()
            .get(&DataKey::MintedCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::MintedCount, &(count + 1));

        token_id
    }

    /// Transfer a ticket from one address to another.
    ///
    /// The ticket must be transferable and in Active status.
    /// Any existing approval is cleared on transfer.
    ///
    /// # Panics
    /// * If `from` is not the ticket owner
    /// * If the ticket is not transferable
    /// * If the ticket is frozen or not active
    pub fn transfer(env: Env, from: Address, to: Address, token_id: u128) {
        from.require_auth();

        let metadata: TicketMetadata = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(token_id))
            .expect("ticket not found");

        assert!(metadata.is_transferable, "ticket is not transferable");
        assert!(metadata.status != TicketStatus::Frozen, "ticket is frozen");
        assert!(
            metadata.status == TicketStatus::Active,
            "ticket is not active"
        );

        let current_owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner(token_id))
            .expect("owner not found");
        assert!(current_owner == from, "not the ticket owner");

        decr_balance(&env, &from);
        incr_balance(&env, &to);
        env.storage()
            .persistent()
            .set(&DataKey::Owner(token_id), &to);

        // Clear any existing approval
        env.storage()
            .persistent()
            .remove(&DataKey::Approval(token_id));
    }

    /// Approve `approved` to transfer ticket `token_id` until `live_until_ledger`.
    pub fn approve(env: Env, approved: Address, token_id: u128, live_until_ledger: u32) {
        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner(token_id))
            .expect("ticket not found");
        owner.require_auth();

        let approval = Approval {
            approved,
            live_until_ledger,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Approval(token_id), &approval);
    }

    /// Get the current owner of `token_id`.
    pub fn owner_of(env: Env, token_id: u128) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::Owner(token_id))
            .expect("ticket not found")
    }

    /// Get the ticket balance for `owner`.
    pub fn balance(env: Env, owner: Address) -> u128 {
        get_balance(&env, &owner)
    }

    /// Get the token collection name.
    pub fn name(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Name)
            .unwrap_or(String::from_str(&env, "Stellar Pass Ticket"))
    }

    /// Get the token collection symbol.
    pub fn symbol(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Symbol)
            .unwrap_or(String::from_str(&env, "SPT"))
    }

    // --- Ticketing Extensions ---

    /// Freeze a ticket to prevent transfers.
    ///
    /// Use cases: flagged scalper, stolen ticket, chargeback pending.
    ///
    /// # Panics
    /// * If called by non-admin
    /// * If ticket is already clawed back
    pub fn freeze(env: Env, ticket_id: u128) {
        require_admin(&env);

        let mut metadata: TicketMetadata = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("ticket not found");

        assert!(metadata.status != TicketStatus::ClawedBack, "ticket is clawed back");
        metadata.status = TicketStatus::Frozen;
        env.storage()
            .persistent()
            .set(&DataKey::Ticket(ticket_id), &metadata);
    }

    /// Unfreeze a ticket (admin only). Re-enables transfers.
    pub fn unfreeze(env: Env, ticket_id: u128) {
        require_admin(&env);

        let mut metadata: TicketMetadata = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("ticket not found");

        assert!(metadata.status == TicketStatus::Frozen, "ticket is not frozen");
        metadata.status = TicketStatus::Active;
        env.storage()
            .persistent()
            .set(&DataKey::Ticket(ticket_id), &metadata);
    }

    /// Clawback a ticket to the issuer/admin.
    ///
    /// Reclaims the ticket from the current holder. Use cases:
    /// refund processing, fraud reversal, ToS violation.
    ///
    /// # Panics
    /// * If called by non-admin
    /// * If ticket is already clawed back
    pub fn clawback(env: Env, ticket_id: u128) {
        require_admin(&env);

        let admin = get_admin(&env);
        let mut metadata: TicketMetadata = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("ticket not found");

        assert!(
            metadata.status != TicketStatus::ClawedBack,
            "ticket already clawed back"
        );

        // Transfer ownership to admin
        let current_owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner(ticket_id))
            .expect("owner not found");

        decr_balance(&env, &current_owner);
        incr_balance(&env, &admin);

        metadata.status = TicketStatus::ClawedBack;
        env.storage()
            .persistent()
            .set(&DataKey::Ticket(ticket_id), &metadata);
        env.storage()
            .persistent()
            .set(&DataKey::Owner(ticket_id), &admin);

        // Clear approval
        env.storage()
            .persistent()
            .remove(&DataKey::Approval(ticket_id));
    }

    /// Burn (permanently destroy) a ticket.
    ///
    /// This action is irreversible. Only the admin can burn tickets.
    ///
    /// # Panics
    /// * If called by non-admin
    /// * If ticket does not exist
    pub fn burn(env: Env, ticket_id: u128) {
        require_admin(&env);

        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner(ticket_id))
            .expect("ticket not found");

        decr_balance(&env, &owner);

        env.storage()
            .persistent()
            .remove(&DataKey::Ticket(ticket_id));
        env.storage()
            .persistent()
            .remove(&DataKey::Owner(ticket_id));
        env.storage()
            .persistent()
            .remove(&DataKey::Approval(ticket_id));
    }

    /// Mark a ticket as used (check-in).
    ///
    /// Non-destructive operation — ticket still exists but cannot
    /// be transferred or used again.
    ///
    /// # Panics
    /// * If called by non-admin
    /// * If ticket is not in Active status
    pub fn mark_used(env: Env, ticket_id: u128) {
        require_admin(&env);

        let mut metadata: TicketMetadata = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("ticket not found");

        assert!(metadata.status == TicketStatus::Active, "ticket is not active");
        metadata.status = TicketStatus::Used;
        env.storage()
            .persistent()
            .set(&DataKey::Ticket(ticket_id), &metadata);
    }

    /// Check if a ticket is transferable.
    pub fn is_transferable(env: Env, ticket_id: u128) -> bool {
        let metadata: TicketMetadata = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("ticket not found");

        metadata.is_transferable && metadata.status == TicketStatus::Active
    }

    /// Get the resale price cap for a ticket. Returns 0 if no cap.
    pub fn get_resale_cap(env: Env, ticket_id: u128) -> i128 {
        let metadata: TicketMetadata = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("ticket not found");

        metadata.resale_price_cap
    }

    /// Get the full metadata for a ticket.
    pub fn get_metadata(env: Env, ticket_id: u128) -> TicketMetadata {
        env.storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("ticket not found")
    }

    /// Get the event ID for a ticket.
    pub fn get_event_id(env: Env, ticket_id: u128) -> Bytes {
        let metadata: TicketMetadata = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("ticket not found");

        metadata.event_id
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Bytes, Env, String};

    fn setup_contract(env: &Env) -> (Address, StellarPassTicketClient<'_>) {
        let admin = Address::generate(env);
        let contract_id = env.register_contract(None, StellarPassTicket);
        let client = StellarPassTicketClient::new(env, &contract_id);

        let name = String::from_str(env, "Stellar Pass Ticket");
        let symbol = String::from_str(env, "SPT");
        client.initialize(&admin, &name, &symbol);

        (admin, client)
    }

    fn sample_metadata(env: &Env) -> TicketMetadata {
        TicketMetadata {
            event_id: Bytes::from_array(env, &[1u8; 8]),
            tier: String::from_str(env, "VIP"),
            event_date: 1700000000u64,
            venue: String::from_str(env, "Madison Square Garden"),
            image_url: String::from_str(env, "https://example.com/ticket.png"),
            is_transferable: true,
            resale_price_cap: 1_000_000_000i128,
            status: TicketStatus::Active,
        }
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let (admin, client) = setup_contract(&env);

        assert_eq!(client.name(), String::from_str(&env, "Stellar Pass Ticket"));
        assert_eq!(client.symbol(), String::from_str(&env, "SPT"));
        assert_eq!(client.balance(&admin), 0);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice_panics() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let contract_id = env.register_contract(None, StellarPassTicket);
        let client = StellarPassTicketClient::new(&env, &contract_id);

        let name = String::from_str(&env, "Test");
        let symbol = String::from_str(&env, "TST");
        client.initialize(&admin, &name, &symbol);
        client.initialize(&admin, &name, &symbol);
    }

    #[test]
    fn test_mint() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        let token_id = client.mint(&alice, &1u128, &meta);

        assert_eq!(token_id, 1u128);
        assert_eq!(client.owner_of(&1u128), alice);
        assert_eq!(client.balance(&alice), 1);
        assert_eq!(client.get_metadata(&1u128), meta);
    }

    #[test]
    #[should_panic(expected = "ticket already exists")]
    fn test_mint_duplicate_id_panics() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);
        client.mint(&alice, &1u128, &meta);
    }

    #[test]
    fn test_transfer() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        client.transfer(&alice, &bob, &1u128);

        assert_eq!(client.owner_of(&1u128), bob);
        assert_eq!(client.balance(&alice), 0);
        assert_eq!(client.balance(&bob), 1);
    }

    #[test]
    #[should_panic(expected = "ticket is not transferable")]
    fn test_transfer_non_transferable_panics() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        env.mock_all_auths();

        let mut meta = sample_metadata(&env);
        meta.is_transferable = false;
        client.mint(&alice, &1u128, &meta);

        client.transfer(&alice, &bob, &1u128);
    }

    #[test]
    #[should_panic(expected = "ticket is frozen")]
    fn test_transfer_frozen_ticket_panics() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        client.freeze(&1u128);
        client.transfer(&alice, &bob, &1u128);
    }

    #[test]
    fn test_approve_and_clears_on_transfer() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        let charlie = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        client.approve(&charlie, &1u128, &999_999u32);

        // Transfer clears approval
        client.transfer(&alice, &bob, &1u128);
        assert_eq!(client.owner_of(&1u128), bob);
    }

    #[test]
    fn test_freeze_unfreeze() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        client.freeze(&1u128);
        assert!(!client.is_transferable(&1u128));

        client.unfreeze(&1u128);
        assert!(client.is_transferable(&1u128));

        // Transfer should work after unfreeze
        client.transfer(&alice, &bob, &1u128);
        assert_eq!(client.owner_of(&1u128), bob);
    }

    #[test]
    fn test_clawback() {
        let env = Env::default();
        let (admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        assert_eq!(client.balance(&alice), 1);
        assert_eq!(client.balance(&admin), 0);

        client.clawback(&1u128);

        assert_eq!(client.owner_of(&1u128), admin);
        assert_eq!(client.balance(&alice), 0);
        assert_eq!(client.balance(&admin), 1);

        let metadata = client.get_metadata(&1u128);
        assert_eq!(metadata.status, TicketStatus::ClawedBack);
    }

    #[test]
    fn test_burn() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);
        assert_eq!(client.balance(&alice), 1);

        client.burn(&1u128);
        assert_eq!(client.balance(&alice), 0);
    }

    #[test]
    #[should_panic(expected = "ticket not found")]
    fn test_burn_removes_ticket() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);
        client.burn(&1u128);

        // Should panic — ticket no longer exists
        client.get_metadata(&1u128);
    }

    #[test]
    fn test_mark_used() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        client.mark_used(&1u128);

        let metadata = client.get_metadata(&1u128);
        assert_eq!(metadata.status, TicketStatus::Used);
    }

    #[test]
    fn test_is_transferable() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        assert!(client.is_transferable(&1u128));

        client.freeze(&1u128);
        assert!(!client.is_transferable(&1u128));
    }

    #[test]
    fn test_get_resale_cap() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        assert_eq!(client.get_resale_cap(&1u128), 1_000_000_000i128);
    }

    #[test]
    fn test_get_event_id() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        let event_id = client.get_event_id(&1u128);
        assert_eq!(event_id, Bytes::from_array(&env, &[1u8; 8]));
    }

    #[test]
    fn test_mint_multiple_tickets() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);
        client.mint(&alice, &2u128, &meta);
        client.mint(&bob, &3u128, &meta);

        assert_eq!(client.balance(&alice), 2);
        assert_eq!(client.balance(&bob), 1);
        assert_eq!(client.owner_of(&1u128), alice);
        assert_eq!(client.owner_of(&2u128), alice);
        assert_eq!(client.owner_of(&3u128), bob);
    }

    #[test]
    fn test_freeze_then_clawback() {
        let env = Env::default();
        let (admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env);
        client.mint(&alice, &1u128, &meta);

        client.freeze(&1u128);
        client.clawback(&1u128);

        let metadata = client.get_metadata(&1u128);
        assert_eq!(metadata.status, TicketStatus::ClawedBack);
        assert_eq!(client.owner_of(&1u128), admin);
    }

    #[test]
    fn test_zero_resale_cap() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let mut meta = sample_metadata(&env);
        meta.resale_price_cap = 0; // no cap
        client.mint(&alice, &1u128, &meta);

        assert_eq!(client.get_resale_cap(&1u128), 0);
    }
}
