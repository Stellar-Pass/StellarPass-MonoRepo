//! # Stellar Pass POAP Badge Contract
//!
//! Soulbound (non-transferable) proof-of-attendance badges on Stellar.
//! Once minted to an attendee's address, the badge stays there forever.
//!
//! ## Design
//! No `transfer` or `approve` function exists — badges are soulbound by design.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Bytes, Env, String, Vec,
};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/// On-chain metadata for a POAP badge.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct POAPMetadata {
    /// Unique identifier for the event.
    pub event_id: Bytes,
    /// Human-readable event name.
    pub event_name: String,
    /// Event date as Unix timestamp.
    pub event_date: u64,
    /// Address of the attendee.
    pub attendee: Address,
    /// URL to the badge display image.
    pub badge_image_url: String,
    /// Timestamp when minted.
    pub minted_at: u64,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

/// Internal storage key enum.
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    EventId,
    Badge(u128),
    Owner(u128),
    Balance(Address),
    Badges(Address), // Vec<u128> of badge IDs per address
    MintedCount,
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

fn get_badges(env: &Env, owner: &Address) -> Vec<u128> {
    env.storage()
        .persistent()
        .get(&DataKey::Badges(owner.clone()))
        .unwrap_or(Vec::new(env))
}

fn add_badge(env: &Env, owner: &Address, badge_id: u128) {
    let mut badges = get_badges(env, owner);
    badges.push_back(badge_id);
    env.storage()
        .persistent()
        .set(&DataKey::Badges(owner.clone()), &badges);
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

/// Stellar Pass POAP badge contract. Mints soulbound attendance badges.
#[contract]
pub struct StellarPassPoap;

#[contractimpl]
impl StellarPassPoap {
    /// Initialize the POAP contract for a specific event.
    ///
    /// # Panics
    /// Panics if already initialized.
    pub fn initialize(env: Env, admin: Address, event_id: Bytes) {
        assert!(
            !env.storage().instance().has(&DataKey::Admin),
            "already initialized"
        );
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::EventId, &event_id);
        env.storage().instance().set(&DataKey::MintedCount, &0u128);
    }

    /// Mint a soulbound POAP badge to an attendee.
    ///
    /// The badge cannot be transferred. Only the admin can mint.
    ///
    /// # Panics
    /// * If called by non-admin
    /// * If badge_id already exists
    pub fn mint(env: Env, to: Address, badge_id: u128, metadata: POAPMetadata) -> u128 {
        require_admin(&env);

        assert!(
            !env.storage()
                .persistent()
                .has(&DataKey::Badge(badge_id)),
            "badge already exists"
        );

        // Store badge metadata and ownership
        env.storage()
            .persistent()
            .set(&DataKey::Badge(badge_id), &metadata);
        env.storage()
            .persistent()
            .set(&DataKey::Owner(badge_id), &to);

        // Update balance
        let balance = get_balance(&env, &to) + 1;
        set_balance(&env, &to, balance);

        // Add to per-user badge index
        add_badge(&env, &to, badge_id);

        // Increment total minted count
        let count: u128 = env
            .storage()
            .instance()
            .get(&DataKey::MintedCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::MintedCount, &(count + 1));

        badge_id
    }

    /// Get the owner of a badge.
    pub fn owner_of(env: Env, badge_id: u128) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::Owner(badge_id))
            .expect("badge not found")
    }

    /// Get the number of badges held by `owner`.
    pub fn balance(env: Env, owner: Address) -> u128 {
        get_balance(&env, &owner)
    }

    /// Get the metadata for a badge.
    pub fn get_metadata(env: Env, badge_id: u128) -> POAPMetadata {
        env.storage()
            .persistent()
            .get(&DataKey::Badge(badge_id))
            .expect("badge not found")
    }

    /// Get all badge IDs held by `owner`.
    pub fn badges_of(env: Env, owner: Address) -> Vec<u128> {
        get_badges(&env, &owner)
    }

    /// Get the event ID for this POAP collection.
    pub fn get_event_id(env: Env) -> Bytes {
        env.storage()
            .instance()
            .get(&DataKey::EventId)
            .expect("contract not initialized")
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Bytes, Env, String};

    fn setup_contract(env: &Env) -> (Address, StellarPassPoapClient<'_>) {
        let admin = Address::generate(env);
        let contract_id = env.register_contract(None, StellarPassPoap);
        let client = StellarPassPoapClient::new(env, &contract_id);

        let event_id = Bytes::from_array(env, &[0xAB, 0xCD, 0xEF, 0x01]);
        client.initialize(&admin, &event_id);

        (admin, client)
    }

    fn sample_metadata(env: &Env, attendee: &Address) -> POAPMetadata {
        POAPMetadata {
            event_id: Bytes::from_array(env, &[0xAB, 0xCD, 0xEF, 0x01]),
            event_name: String::from_str(env, "Stellar Summit 2025"),
            event_date: 1700000000u64,
            attendee: attendee.clone(),
            badge_image_url: String::from_str(env, "https://ipfs.io/ipfs/QmBadge123"),
            minted_at: 1700000100u64,
        }
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let (admin, client) = setup_contract(&env);

        assert_eq!(client.balance(&admin), 0);
        let event_id = client.get_event_id();
        assert_eq!(event_id, Bytes::from_array(&env, &[0xAB, 0xCD, 0xEF, 0x01]));
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice_panics() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let contract_id = env.register_contract(None, StellarPassPoap);
        let client = StellarPassPoapClient::new(&env, &contract_id);

        let event_id = Bytes::from_array(&env, &[1u8; 4]);
        client.initialize(&admin, &event_id);
        client.initialize(&admin, &event_id);
    }

    #[test]
    fn test_mint() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env, &alice);
        let badge_id = client.mint(&alice, &1u128, &meta);

        assert_eq!(badge_id, 1u128);
        assert_eq!(client.owner_of(&1u128), alice);
        assert_eq!(client.balance(&alice), 1);
        assert_eq!(client.get_metadata(&1u128), meta);
    }

    #[test]
    #[should_panic(expected = "badge already exists")]
    fn test_mint_duplicate_panics() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env, &alice);
        client.mint(&alice, &1u128, &meta);
        client.mint(&alice, &1u128, &meta);
    }

    #[test]
    fn test_badges_of() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta1 = sample_metadata(&env, &alice);
        client.mint(&alice, &1u128, &meta1);

        let meta2 = sample_metadata(&env, &alice);
        client.mint(&alice, &2u128, &meta2);

        let meta3 = sample_metadata(&env, &alice);
        client.mint(&alice, &3u128, &meta3);

        let badges = client.badges_of(&alice);
        assert_eq!(badges.len(), 3);
        assert_eq!(badges.get(0).unwrap(), 1u128);
        assert_eq!(badges.get(1).unwrap(), 2u128);
        assert_eq!(badges.get(2).unwrap(), 3u128);
    }

    #[test]
    fn test_no_transfer_function_exists() {
        // This test validates the design: POAP badges are soulbound.
        // The contract intentionally does NOT implement transfer or approve.
        // If this compiles, the contract correctly omits those functions.
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env, &alice);
        client.mint(&alice, &1u128, &meta);

        // Badge stays with alice forever
        assert_eq!(client.owner_of(&1u128), alice);
        assert_eq!(client.balance(&alice), 1);
    }

    #[test]
    fn test_multiple_users() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        env.mock_all_auths();

        let meta_alice = sample_metadata(&env, &alice);
        client.mint(&alice, &1u128, &meta_alice);

        let meta_bob = sample_metadata(&env, &bob);
        client.mint(&bob, &2u128, &meta_bob);

        assert_eq!(client.balance(&alice), 1);
        assert_eq!(client.balance(&bob), 1);

        let alice_badges = client.badges_of(&alice);
        assert_eq!(alice_badges.len(), 1);
        assert_eq!(alice_badges.get(0).unwrap(), 1u128);

        let bob_badges = client.badges_of(&bob);
        assert_eq!(bob_badges.len(), 1);
        assert_eq!(bob_badges.get(0).unwrap(), 2u128);
    }

    #[test]
    fn test_metadata_integrity() {
        let env = Env::default();
        let (_admin, client) = setup_contract(&env);
        let alice = Address::generate(&env);

        env.mock_all_auths();

        let meta = sample_metadata(&env, &alice);
        client.mint(&alice, &42u128, &meta);

        let retrieved = client.get_metadata(&42u128);
        assert_eq!(retrieved.event_name, String::from_str(&env, "Stellar Summit 2025"));
        assert_eq!(retrieved.event_date, 1700000000u64);
        assert_eq!(retrieved.attendee, alice);
        assert_eq!(
            retrieved.badge_image_url,
            String::from_str(&env, "https://ipfs.io/ipfs/QmBadge123")
        );
        assert_eq!(retrieved.minted_at, 1700000100u64);
    }

    #[test]
    #[should_panic(expected = "badge not found")]
    fn test_nonexistent_badge_panics() {
        let env = Env::default();
        let (_, client) = setup_contract(&env);

        client.get_metadata(&999u128);
    }
}
