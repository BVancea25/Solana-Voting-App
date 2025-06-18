use anchor_lang::prelude::*;

const MAX_LABELS: usize = 10; // Maximum number of distinct options
const MAX_LABEL_SIZE: usize = 32;
const MAX_VOTERS: usize = 100;      
const MAX_ALLOW: usize = 50; 

declare_id!("5bMC9ahzar51f1ER4eoN34JWr2NtQdsAwfECQ985Bfvb");

#[program]
mod voting_app {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>, 
        labels: Vec<String>, 
        close_time: i64,
        allow_list: Vec<Pubkey>
    ) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;

        vote_account.options = labels
            .into_iter()
            .map(|label| OptionCount { label, count: 0 })
            .collect();

        vote_account.voters = Vec::new();
        vote_account.close_time = close_time;
        vote_account.allow_list = allow_list;
        Ok(())
    }

    pub fn close_session(ctx: Context<CloseSession>) -> Result<()> {
        Ok(())
    }

    // Vote by index into that vector
    pub fn vote(ctx: Context<Vote>, choice_index: u32) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;
        let user = ctx.accounts.user.key();
        let now = Clock::get()?.unix_timestamp;
        
        //check permission
        if !vote_account.allow_list.is_empty() && !vote_account.allow_list.iter().any(|pk| pk == &user){
            return Err(error!(ErrorCode::PermissionDenied));
        }

        //  Voting session period valdiation
        if now > vote_account.close_time{
            return Err(error!(ErrorCode::VotingClosed));
        }
        
         //  Immutable borrow for the double‐vote check
        {
            let voters = &vote_account.voters;
            // validation for double voting
            if voters.iter().any(|pk| pk == &ctx.accounts.user.key()){
                return Err(error!(ErrorCode::AlreadyVoted));
            }
        }
        
        //  Mutable borrow of options to increment the count
        {
            let opt = vote_account
                .options
                .get_mut(choice_index as usize)
                .ok_or(ErrorCode::InvalidChoice)?;
            opt.count = opt.count.checked_add(1).ok_or(ErrorCode::Overflow)?;
            msg!("Voted for: {}", opt.label);
        }

        //  Mutable borrow of voters to record this voter
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

    // empty = public, non-empty = private
    pub allow_list: Vec<Pubkey>
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
        space = 8 + // discriminator
            // options vector
            4 + (MAX_LABELS * (4 + MAX_LABEL_SIZE + 8)) +
            // voters vector
            4 + (MAX_VOTERS * 32) +
            // close_time
            8 +
            // allow_list
            4 + (MAX_ALLOW * 32)
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

#[derive(Accounts)]
pub struct CloseSession<'info> {
  #[account(mut, close = user)]
  pub vote_account: Account<'info, VoteAccount>,
  #[account(mut)]
  pub user: Signer<'info>,
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
    VotingClosed,
    #[msg("You are not allowed to vote in this session")]
    PermissionDenied,
    #[msg("Max labels exceeded")] 
    MaxLabelsExceeded,
    #[msg("Max allow list size exceeded")] 
    MaxAllowExceeded
}