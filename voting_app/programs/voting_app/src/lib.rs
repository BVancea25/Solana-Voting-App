use anchor_lang::prelude::*;

const MAX_LABELS: usize = 10; // Maximum number of distinct options
const MAX_LABEL_SIZE: usize = 32;

declare_id!("5bMC9ahzar51f1ER4eoN34JWr2NtQdsAwfECQ985Bfvb");

#[program]
mod voting_app {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, labels: Vec<String>, close_time: i64) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;

        vote_account.options = labels
            .into_iter()
            .map(|label| OptionCount { label, count: 0 })
            .collect();

        vote_account.voters = Vec::new();
        vote_account.close_time = close_time;
        Ok(())
    }

    // Vote by index into that vector
    pub fn vote(ctx: Context<Vote>, choice_index: u32) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;
        let now = Clock::get()?.unix_timestamp;

        // 0) Voting session period valdiation
        if now > vote_account.close_time{
            return Err(error!(ErrorCode::VotingClosed));
        }

         // 1) Immutable borrow for the double‐vote check
        {
            let voters = &vote_account.voters;
            // validation for double voting
            if voters.iter().any(|pk| pk == &ctx.accounts.user.key()){
                return Err(error!(ErrorCode::AlreadyVoted));
            }
        }
        
        // 2) Mutable borrow of options to increment the count
        {
            let opt = vote_account
                .options
                .get_mut(choice_index as usize)
                .ok_or(ErrorCode::InvalidChoice)?;
            opt.count = opt.count.checked_add(1).ok_or(ErrorCode::Overflow)?;
            msg!("Voted for: {}", opt.label);
        }

        // 3) Mutable borrow of voters to record this voter
        {
            let voters_mut = &mut vote_account.voters;
            voters_mut.push(ctx.accounts.user.key());
        }

        Ok(())
    }
}

#[account]
pub struct VoteAccount {
    // A dynamic list of (label, count) pairs
    pub options: Vec<OptionCount>, 

    // vector of voters to keep track of double votes
    pub voters: Vec<Pubkey>,

    // UNIX timestamp after which voting is disabled
    pub close_time: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OptionCount {
    //vote option
    pub label: String, 

    //vote amount for that option
    pub count: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 4 + (MAX_LABELS * (4 + MAX_LABEL_SIZE) + MAX_LABELS * 8)
    )]
    pub vote_account: Account<'info, VoteAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    //the vote account / voting session
    #[account(mut)]
    pub vote_account: Account<'info, VoteAccount>,

    //user required to sign with a public key to vote
    pub user: Signer<'info>
}

#[error_code]
pub enum ErrorCode {
    #[msg("Vote count overflow")]
    Overflow,
    #[msg("Invalid choice index")]
    InvalidChoice,
    #[msg("This wallet has already voted")]
    AlreadyVoted,
    #[msg("The voting session has ended")]
    VotingClosed
}