import os
import base64
from github import Github, GithubException

GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_REPO = os.getenv('GITHUB_SESSIONS_REPO')  # e.g., 'minhdo714/telegram-sessions'

g = Github(GITHUB_TOKEN)

async def upload_session_to_github(account_id, session_data):
    """Upload Telegram session file to GitHub"""
    try:
        repo = g.get_repo(GITHUB_REPO)
        file_path = f"sessions/{account_id}.session"
        
        # Convert session data to base64
        if isinstance(session_data, bytes):
            content = base64.b64encode(session_data).decode()
        else:
            content = base64.b64encode(session_data.encode()).decode()
        
        try:
            # Try to get existing file
            existing_file = repo.get_contents(file_path)
            # Update if exists
            repo.update_file(
                file_path,
                f"Update session for account {account_id}",
                content,
                existing_file.sha,
                branch="main"
            )
        except GithubException:
            # Create if doesn't exist
            repo.create_file(
                file_path,
                f"Add session for account {account_id}",
                content,
                branch="main"
            )
        
        return file_path
    
    except Exception as e:
        print(f"Error uploading session to GitHub: {e}")
        raise e

async def download_session_from_github(account_id):
    """Download Telegram session file from GitHub"""
    try:
        repo = g.get_repo(GITHUB_REPO)
        file_path = f"sessions/{account_id}.session"
        
        file_content = repo.get_contents(file_path)
        session_data = base64.b64decode(file_content.content)
        
        return session_data
    
    except GithubException as e:
        if e.status == 404:
            return None  # File doesn't exist
        raise e
    
    except Exception as e:
        print(f"Error downloading session from GitHub: {e}")
        return None

async def delete_session_from_github(account_id):
    """Delete Telegram session file from GitHub"""
    try:
        repo = g.get_repo(GITHUB_REPO)
        file_path = f"sessions/{account_id}.session"
        
        file_content = repo.get_contents(file_path)
        repo.delete_file(
            file_path,
            f"Delete session for account {account_id}",
            file_content.sha,
            branch="main"
        )
        
        return True
    
    except Exception as e:
        print(f"Error deleting session from GitHub: {e}")
        return False
