use anchor_lang::prelude::*;

const MAX_LABELS: usize = 10; // Maximum number of distinct options
const MAX_LABEL_SIZE: usize = 32;

declare_id!("5bMC9ahzar51f1ER4eoN34JWr2NtQdsAwfECQ985Bfvb");

#[program]
mod voting_app {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, labels: Vec<String>) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;

        vote_account.options = labels
            .into_iter()
            .map(|label| OptionCount { label, count: 0 })
            .collect();
        Ok(())
    }

    // Vote by index into that vector
    pub fn vote(ctx: Context<Vote>, choice_index: u32) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;
        let opt = vote_account
            .options
            .get_mut(choice_index as usize)
            .ok_or(ErrorCode::InvalidChoice)?;
        opt.count = opt.count.checked_add(1).ok_or(ErrorCode::Overflow)?;
        msg!("Voted for: {}", opt.label);
        Ok(())
    }
}

#[account]
pub struct VoteAccount {
    // A dynamic list of (label, count) pairs
    pub options: Vec<OptionCount>, // Vec<T> serializes as 4 + Σ(each element) bytes :contentReference[oaicite:0]{index=0}
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OptionCount {
    pub label: String, // String serializes as 4 + len bytes :contentReference[oaicite:1]{index=1}
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
    #[account(mut)]
    pub vote_account: Account<'info, VoteAccount>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Vote count overflow")]
    Overflow,
    #[msg("Invalid choice index")]
    InvalidChoice,
}