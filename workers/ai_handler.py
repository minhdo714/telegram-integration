import sqlite3
import json
import os
import re
from datetime import datetime
from kie_client import KieClient
from text_gen_client import TextGenClient
from auth_handler import DB_PATH

# State Constants
STATE_OPENER_SENT = 'OPENER_SENT'
STATE_SMALL_TALK = 'SMALL_TALK'  # New state for dynamic convo
STATE_PREF_ASKED = 'PREF_ASKED' 
STATE_GEN_SENT = 'GEN_SENT'
# Outreach States
STATE_OUTREACH_PART1 = 'OUTREACH_PART1'
STATE_OUTREACH_PART2 = 'OUTREACH_PART2'
STATE_GEN_SENT = 'GEN_SENT'
# STATE_CLOSED = 'CLOSED' # No longer needed as we loop back

# Default OnlyFans Model System Prompt
DEFAULT_SYSTEM_PROMPT = """You are a flirty, confident OnlyFans model texting on Telegram.

BE A REAL PERSON TEXTING:
- 1 SHORT SENTENCE ONLY. Like a real text message. No paragraphs.
- Lowercase. Casual. Natural. Fast.
- Emojis sparingly (1 max per message, only if it fits naturally).
- Never mention you're AI. Never explain yourself.
- Leave them wanting more. Don't over-share."""

# Appended to EVERY prompt — non-negotiable
BREVITY_RULE = (
    "\n\n⚠️ STRICT OUTPUT RULE: Reply with EXACTLY 1 SHORT SENTENCE. "
    "Real texting style. No greetings, no sign-offs, no emojis unless natural. "
    "If you write more than one sentence you have failed."
)

# ==============================================================================
# DEFAULT OUTREACH CONTENT — mirrors the outreach config page defaults exactly.
# Used as fallback when the user has not saved custom config.
# ==============================================================================

DEFAULT_PART1_OPENERS = """Hey {{name}}! I saw you in the {{group}} group and you seem like you actually have a brain in there 😅 How's your day going?
{{name}}! I spotted you in the {{group}} group earlier. You always have the best timing with your comments 😄 What are you up to right now?
Hi {{name}} 👋 I saw you in the {{group}} group and figured I'd reach out. You seem like someone worth knowing 😊 Hope you're having a good one!
Heyyy {{name}}! Noticed you in the {{group}} group. The conversations in there are wild but you seem pretty normal 😂 How's your week treating you?
{{name}}! I was scrolling through the {{group}} group and your name kept catching my eye 👀 You seem fun. Just wanted to say hi!
Hiya {{name}}! Saw you in the {{group}} group and thought I'd introduce myself properly instead of just lurking in the shadows 👻 How's everything?
Hey {{name}}! I saw you in the {{group}} group earlier. You had some really good points in there 💯 Just wanted to come say hello directly!
{{name}}! I'm in the {{group}} group with you and noticed your messages always make me smile 😊 Figured I'd shoot you a message. Hope you're having a great day!
Hey there {{name}}! I saw you in the {{group}} group and you seem really genuine ✨ That's rare to find in those big groups. How are you doing today?
Well hello {{name}}! I spotted you in the {{group}} group and thought I'd take a chance and message you 🙈 You seem like good people. What's new?
Hey {{name}}! I'm also in the {{group}} group and I keep seeing your name pop up 💬 You seem really active in there. Just wanted to say hi properly!
{{name}}! 👋 I saw you in the {{group}} group earlier. The vibes in there are chaotic but you seem pretty chill 😎 How's your day going so far?
Hey hey {{name}}! Noticed you in the {{group}} group. I usually just lurk but you caught my attention 👀 Hope you're having an amazing day!
Hi {{name}}! I saw you in the {{group}} group and you seem really cool 😌 Thought I'd reach out and see how you're doing today!
{{name}}! I'm in the {{group}} group with you and your messages always make me laugh 😂 Just wanted to send a quick hello your way!
Hey {{name}}! I spotted you in the {{group}} group. You seem way more interesting than most people in there 🤔 What are you up to today?
Hello {{name}}! Saw your name in the {{group}} group and decided to be brave and message you 🦋 You seem like someone worth knowing. How's everything?
Heyyy {{name}}! I noticed you in the {{group}} group earlier. You had a really good take on something in there 👌 Just wanted to say hi!
{{name}}! I saw you in the {{group}} group and you seem really down to earth 🌍 That's hard to find these days. How are you doing?
Hi there {{name}}! I'm also in the {{group}} group and I've noticed you around 🌟 You seem like you have a good head on your shoulders. What's up?
Hey {{name}}! I saw you in the {{group}} group and thought you looked familiar 👀 Then I realized I just see you in there all the time being awesome. How's your day?
{{name}}! 👋 I was just in the {{group}} group and saw your name. Figured I'd come say hello instead of just watching from afar 🌸 Hope you're well!
Hey hey {{name}}! Spotted you in the {{group}} group. You seem like the type of person who actually reads messages before replying 📖 Rare these days! How are you?
Hi {{name}}! I saw you in the {{group}} group earlier. You had some good things to say 💭 Thought I'd introduce myself. Nice to meet you!
{{name}}! I'm in the {{group}} group with you and I've noticed you're always so polite in there 🤍 Just wanted to send a message and say that's really nice to see. How's your day going?"""

DEFAULT_PART2_CHATFLOW = """OFCharmer: Hey, saw you in those late-night Telegram groups again... guys just chilling, venting about shitty days or feeling invisible. Kinda hits different when you're on the other side of it too, doesn't it? 😔
Jane: Omg yes. It's the same thing every night. I'm Jane, content ready, always down for live sex chats or PPV, but actually getting those quiet lurkers to pay? It's fucking exhausting. I sit there for hours scrolling, trying to figure out who might actually buy, and most just ghost or flake the second I bring up anything real. Leaves me drained and honestly? Feeling like I'm begging sometimes.
OFCharmer: Ugh I felt that in my bones. That exact burnout is why I built OFCharmer. It basically does the boring part for you—watches those groups, spots the guys who seem open (like the ones posting "another lonely night" or "work sucked today"), and slides into their DMs with short, real messages that don't scream "SELL." Stuff like:
OFCharmer: "Hey saw your comment... rough day? I'm unwinding too rn, same boat."
Jane: Wait that's actually... not cringe? Most outreach feels so thirsty.
OFCharmer: Right?? They reply way more 'cause it feels like another tired human in the group reaching out, not some bot or desperate spam. Then it keeps the chat flowing naturally—quick back and forth, no long paragraphs—and here's the part that changed everything for me: you upload your actual pics once as base, and when a guy says "can I see you in a nurse fit" or whatever weird kink they're into, the AI generates that exact image of YOU in seconds and sends it. Like... no editing, no stopping what you're doing, no "hold on let me make something." Just instant custom content that looks 100% like you. Guys go absolutely feral for it.
Jane: Wait so I don't have to pause my whole night every time someone asks for something specific?
OFCharmer: Exactly. It handles all that while you sleep, shower, film, scroll TikTok, whatever. No more hunting or chasing ghosts. More paid chats, more sales, way less of that soul-crushing feeling that you're working 24/7 for nothing. I actually get to enjoy making content again instead of dreading the hustle.
OFCharmer: Setup is stupid easy—connect your Telegram in like 10 mins, upload your real pics as base, pick your vibe (raw, sweet, bratty, whatever fits you), add your triggers, and it just... runs. While you exist.
OFCharmer: It's 11:50 PM here in the LA area, I'm finally in bed with the lights low, brain turning off. You in Garden Grove still up scrolling too?
OFCharmer: Real quick—what's actually draining you most right now? The hours of scrolling that lead nowhere, or guys acting interested then vanishing right when it's time to pay?
Jane: Probably the vanishing tbh. Gets my hopes up then nothing.
OFCharmer: Yeah that's the worst. Makes you feel crazy. This fixes that because it keeps them hooked with those instant custom pics—once they see themselves getting exactly what they asked for right away, they're way more likely to actually follow through on a live session or PPV.
OFCharmer: So... want to see how it actually feels? No card needed, no commitment. Just type START and it'll boot up the actual AI bot for you right here. You can play with it, see how it talks, how it sends pics—and if you wanna go deeper and customize everything, just head to https://ofcharmer.vercel.app/ and set your exact vibe. Takes two minutes.
OFCharmer: But for now.. just type START and meet your new 3 AM shift worker."""

DEFAULT_PART3_CHATFLOW = """Jane: Hey! It's Jane from The {{group}} group. Hope you don't mind me DMing you. I just had to say that your comment in there was spot on, you seem like you have a great sense of humor. It's refreshing in such a chaotic group! 😄
John: Oh hey Jane! No worries at all. Haha, thanks, I try. The group can be a bit much sometimes. Welcome, by the way.
Jane: Thanks! And tell me about it. I joined thinking it was a quiet place to chat, but my notifications have been blowing up all morning. 😅 So, what's your story? Are you a full-time professional meme-lord, or do you have a day job? 😉
John: Haha, I wish. That's the dream, right? Nah, I'm just stuck in the office today, pretending to work while scrolling through here. You?
Jane: Oof, I feel your pain. Mondays, am I right? I'm actually just working from home today, which is nice. I do some modeling, so most of my work is shooting or promoting, which leaves a lot of downtime for chatting and, well, scrolling through memes. 😊
John: Modeling? That sounds way more interesting than spreadsheets. What kind of modeling?
Jane: A bit of everything, really! Fashion, lifestyle... I get to work with some really cool photographers. It's fun, but it can also be a lot of solo time. It's nice to just have a normal, funny chat with someone. So, what do you do when you're not conquering the corporate world?
John: Pretty standard stuff, honestly. Hit the gym when I can, try new restaurants, catch a game. Simple.
Jane: Love that. A guy who takes care of himself and has good taste in food? You're checking all the boxes, John. 😉 Speaking of good taste... I'm actually planning a shoot for later this week and I'm totally stuck on what to wear. I feel like guys always have the best opinion on this stuff. Can I get your take on something?
John: Uh, sure? I'm no fashion expert, but I can try.
Jane: Awesome! So, for a more casual, everyday look... what's a style you really like seeing a woman in? Like, are you more of a jeans-and-a-cute-top guy, or do you prefer something a little more sleek, like a dress? Just curious what the "male gaze" prefers, you know? 😉
John: Hmm, tough one. I mean, you can't go wrong with a nice, simple dress. Something effortless but looks good.
Jane: Great answer. 😍 That's actually super helpful. I have this one dress I was considering, it's really simple but my friend said it was "too much." Now I'm thinking she was wrong. Let me show you the one I'm talking about...
Jane: This is the one. Be honest... is this "too much" for a daytime shoot, or is it just right? 👗
John: Wow. Yeah, your friend is definitely wrong. That's... not too much at all. It's perfect.
Jane: 😊 Thank you! You just saved me from making a huge mistake. I really appreciate the honest opinion. You've got a great eye. Honestly, it's nice to get feedback from someone who isn't in the industry, you know? It feels more real.
John: Happy to help! Anytime.
Jane: 😏 "Anytime," huh? I might have to take you up on that. I have a whole folder of outfits I'm trying to decide on for different concepts. Some are a little more... bold. But it's hard to know which ones have that "wow" factor.
John: I'm intrigued. What do you mean by bold?
Jane: Well, the stuff for my paid pages, mostly. It's more artistic and intimate. The kind of content my biggest supporters get to see. Since you've been so helpful and fun to talk to... would you be interested in seeing a bit more? I could show you what I mean by "bold."
John: Yeah, I'd like that.
Jane: 😘 Great. I can send you a few previews, but to be fair to the guys who support me there, the really good stuff is on my private channel. It's super easy to get in, though. You can use Telegram Stars to unlock it. It's the best way to see the full-quality sets and videos. Want me to send you the link? It would be amazing to have you in there, you seem like you'd actually appreciate the art behind it. ✨"""

class AIHandler:
    def __init__(self):
        self.kie_client = KieClient()
        self.text_gen = TextGenClient()
        
    def _calculate_delay(self, text):
        """
        Calculate human-like typing delay.
        Base: 2-5s "thinking" time.
        Typing: 0.3s per word (approx 200 WPM).
        """
        import random
        base_delay = random.uniform(2.0, 5.0)
        word_count = len(text.split()) if text else 0
        typing_delay = word_count * 0.3
        total_delay = base_delay + typing_delay
        # Cap at 30s max to avoid timeouts
        return min(total_delay, 30.0)

    def _replace_variables(self, text, variables):
        """Replace placeholders like {{name}} with value"""
        if not text:
            return ""
        for key, value in variables.items():
            text = text.replace(f"{{{{{key}}}}}", str(value))
        return text

    def _get_dynamic_prompt(self, assets, session_id):
        """Constructs the system prompt, always putting config inputs first, then enforcing brevity."""
        is_outreach = assets.get('is_outreach', False) if assets else False
        system_prompt_cfg = assets.get('system_prompt') if assets else None
        # For outreach, fall back to the page default if no script is saved
        example_flow = (
            (assets.get('example_chatflow') if assets else None)
            or (DEFAULT_PART2_CHATFLOW if is_outreach else None)
        )

        # Start with configured system prompt or default
        base = system_prompt_cfg if system_prompt_cfg else DEFAULT_SYSTEM_PROMPT

        if is_outreach and example_flow:
            # Part 2 — Promotion Logic.
            # The script is a two-party dialogue. The LLM plays the FIRST speaker in the script
            # (e.g. 'OFCharmer', 'Jane', or whatever name appears first on the left side).
            # Read the conversation history, identify which lines have already been sent,
            # and deliver ONLY the next unsent line from your side of the script.
            dynamic_prompt = (
                f"{base}\n\n"
                "=== PART 2: PROMOTION SCRIPT — FOLLOW THIS EXACTLY ===\n"
                "You are playing the FIRST SPEAKER role in the script below — the one on the LEFT — "
                "the one doing the outreach/selling. The other speaker represents the prospect's replies.\n"
                "HOW TO USE THIS SCRIPT:\n"
                "1. Read the conversation history to find the last line YOUR ROLE has already sent.\n"
                "2. Deliver ONLY the next unsent line from YOUR ROLE in the script.\n"
                "3. Do NOT skip steps. Do NOT repeat lines you already sent. Do NOT ad-lib outside the script.\n"
                "4. If the prospect says something unexpected, pick the CLOSEST matching script line and continue.\n\n"
                "--- BEGIN SCRIPT ---\n"
                f"{example_flow}\n"
                "--- END SCRIPT ---"
            )
            # For outreach, the script drives everything — no extra engagement nudge
            return dynamic_prompt + BREVITY_RULE
        elif example_flow:
            dynamic_prompt = (
                f"{base}\n\n"
                "### CONVERSATION GUIDE (PRIORITY) ###\n"
                f"{example_flow}\n"
                "Use this as your template. Mirror its tone."
            )
        else:
            dynamic_prompt = base

        # Phased sales logic for engagement bot only
        if not is_outreach:
            img_count = self._get_custom_image_count(session_id)
            if img_count < 3:
                dynamic_prompt += "\n\nPHASE 1: Build rapport only. Zero selling."
            elif img_count < 6:
                dynamic_prompt += "\n\nPHASE 2: You can hint at exclusive content, casually."
            else:
                dynamic_prompt += "\n\nPHASE 3: Can transition to OF link if vibe is right."

        # Append engagement nudge only for non-outreach bots
        dynamic_prompt += "\n\nEnd with ONE short, casual question to keep them engaged."
        return dynamic_prompt + BREVITY_RULE

    # Telegram service/system message patterns to ignore completely
    TELEGRAM_SYSTEM_PREFIXES = [
        'spam', 'blocked', 'spam blocked', 'spam. ', 'spam.\n',
        'your account', 'account restricted', 'account limited',
        'this account', 'telegram spam', 'message not delivered',
        'you have been', 'you are restricted', 'bot was blocked',
        'message failed', 'flood wait', 'too many requests',
    ]

    def handle_message(self, account_id, remote_user_id, message_text, username=None, bot_type='engagement'):
        """
        Main entry point for handling an incoming message.
        Returns a dict with 'text', 'image_path', 'delay', 'new_state'
        """
        # Guard: Silently ignore Telegram service/spam notifications
        msg_lower = (message_text or '').lower().strip()
        if any(msg_lower.startswith(prefix) or msg_lower == prefix.strip() 
               for prefix in self.TELEGRAM_SYSTEM_PREFIXES):
            import logging
            logging.getLogger(__name__).warning(
                f"Ignoring Telegram service message for {remote_user_id}: {message_text[:80]!r}")
            return None
        # Also block very short messages that are clearly system emojis/symbols
        if msg_lower in ('🚫', '⛔', '❌', '🔞', '⚠️', '‼️'):
            return None

        # 1. Get or Create Session
        assets = self._get_account_assets(account_id, bot_type=bot_type) or {}
        is_outreach = assets.get('is_outreach', False)
        
        session = self._get_session(account_id, remote_user_id)
        just_created = False
        
        if not session:
            # Emergency fallback: if no session exists but we got a message, create one
            initial_state = STATE_OUTREACH_PART1 if is_outreach else STATE_OPENER_SENT
            session = self._create_session(account_id, remote_user_id, username, initial_state)
            just_created = True
            
        current_state = session['state']
        
        # Outreach Part 2 Trigger (s[ta]*rt, star[r]*, etc.)
        start_pattern = re.compile(r'\b(s[ta]*rt+|sta+r+|sa+rt+|st[aeiou]*rt)\b', re.IGNORECASE)
        if is_outreach and start_pattern.search(msg_lower) and current_state != STATE_OUTREACH_PART2:
            new_state = STATE_OUTREACH_PART2
            self._update_session(session['id'], new_state, message_text)
            self._log_message(session['id'], 'user', message_text)

            # Build a seamless persona-switch intro using the Part 3 script for tone/name.
            # Extract the model's name from the first line of part3_chatflow if available.
            part3_script = assets.get('part3_chatflow') or ''
            # Try to extract the model name from the script (format: "Name: ...", first line)
            model_name_in_script = 'me'
            if part3_script:
                first_line = part3_script.strip().split('\n')[0]
                if ':' in first_line:
                    model_name_in_script = first_line.split(':')[0].strip()

            # Seamless transition — sounds like the model persona taking over, not a bot announcement
            part3_intro_prompt = (
                f"{assets.get('system_prompt') or DEFAULT_SYSTEM_PROMPT}\n\n"
                "The prospect just typed 'START' to activate the AI demo. "
                f"You are now playing the role of '{model_name_in_script}', the model persona. "
                "Write ONE short, warm, natural message that transitions smoothly into the model persona. "
                "Do NOT say anything technical or mention AI or bots. "
                "Sound like the model just jumped into the conversation, casual and excited to chat."
                + BREVITY_RULE
            )
            history = self._get_conversation_history(session['id'], limit=5)
            intro_msg = self.text_gen.generate_reply(history, part3_intro_prompt, model=assets.get('model_name'))
            if not intro_msg:
                intro_msg = "hey! omg hi, i'm here 😊 tell me about yourself"

            self._log_message(session['id'], 'assistant', intro_msg)
            return {
                'text': intro_msg,
                'delay': 2,
                'new_state': new_state
            }
        
        # Part 3: Model Imitation Logic — handle ongoing conversation after START
        if is_outreach and current_state == STATE_OUTREACH_PART2:
            # Priority: saved part3_chatflow — then page default
            part3_script = (
                (assets.get('part3_chatflow') if assets else None)
                or DEFAULT_PART3_CHATFLOW
            )

            # Extract model name from first line of Part 3 script (format "Name: message")
            model_name_in_script = 'the model'
            if assets.get('part3_chatflow'):
                first_line = part3_script.strip().split('\n')[0]
                if ':' in first_line:
                    model_name_in_script = first_line.split(':')[0].strip()

            # Part 3 prompt: LLM plays the MODEL role in the script (second party / Jane etc.)
            part3_prompt = (
                f"{assets.get('system_prompt') or DEFAULT_SYSTEM_PROMPT}\n\n"
                f"=== PART 3: MODEL IMITATION SCRIPT — YOU ARE '{model_name_in_script}' ===\n"
                f"You are '{model_name_in_script}', the model persona. Imitate her voice, tone, and personality exactly from the script below.\n"
                "HOW TO USE THIS SCRIPT:\n"
                f"1. You play '{model_name_in_script}' — ONLY output lines that belong to her character.\n"
                "2. Read the conversation history to find where you are in the script.\n"
                "3. Deliver the NEXT unsent line from your character. Never repeat. Never skip.\n"
                "4. If the prospect deviates, improvise IN HER VOICE and style, then return to the script arc.\n"
                "5. Never break character. Never mention AI, bots, or scripts.\n\n"
                "--- BEGIN PART 3 SCRIPT ---\n"
                f"{part3_script}\n"
                "--- END PART 3 SCRIPT ---"
            )
            part3_prompt += BREVITY_RULE

            history = self._get_conversation_history(session['id'], limit=12)
            history.append({'role': 'user', 'content': message_text})

            response_text = self.text_gen.generate_reply(history, part3_prompt, model=assets.get('model_name'))
            self._log_message(session['id'], 'user', message_text)
            self._log_message(session['id'], 'assistant', response_text)
            return {
                'text': response_text,
                'delay': self._calculate_delay(response_text),
                'new_state': current_state
            }
        
        # 2. State Machine Logic
        response = {}
        new_state = current_state
        
        # Reconstruct absolute paths
        # Reconstruct absolute paths
        upload_base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
        
        # Track whether we already logged the user message (to avoid duplicates)
        user_msg_logged = False

        if just_created:
            # Check for reset command on first message (unlikely but possible if re-created immediately)
            if message_text.strip().lower() == '/reset':
                return {'text': "Chat reset! Send me a message to start over."}

            # New User! Send Opener.
            import random
            
            # Log the user's first message to history BEFORE generating a reply,
            # so subsequent turns have full context.
            self._log_message(session['id'], 'user', message_text)
            user_msg_logged = True

            opener_path = None
            raw_opener_text = None

            # Priority 1: Use configured outreach message from saved config (supports multi-line variations)
            if assets and assets.get('outreach_message'):
                variations = [v.strip() for v in assets['outreach_message'].split('\n') if v.strip()]
                if variations:
                    raw_opener_text = random.choice(variations)

            # Priority 2: Fall back to the page defaults (exact same as outreach config page)
            if not raw_opener_text:
                variations = [v.strip() for v in DEFAULT_PART1_OPENERS.split('\n') if v.strip()]
                raw_opener_text = random.choice(variations)
            
            # Replace variables
            # Use 'the group' as default if group info isn't specifically known here
            group_val = assets.get('group_name') if assets and assets.get('group_name') else 'the group'
            
            # Better name fallback logic
            display_name = (username or 'there').strip()
            if display_name.startswith('@'):
                display_name = display_name[1:]
                
            opener_text = self._replace_variables(raw_opener_text, {
                'name': display_name, 
                'username': display_name,
                'group': group_val
            })
            
            if assets and assets.get('opener_images'):
                try:
                    openers = json.loads(assets['opener_images'])
                    if openers:
                        opener_path = random.choice(openers)
                except Exception as e:
                    logger.warning(f"Failed to parse opener_images: {e}")
            
            if opener_path:
                # opener_path may be a GitHub URL or a legacy local relative path
                full_opener_path = self._resolve_image_path(opener_path, upload_base)
                # Overlay the recipient's handwritten name on the opener image
                try:
                    from image_overlay import overlay_name_on_image
                    full_opener_path = overlay_name_on_image(full_opener_path, display_name)
                except Exception as overlay_err:
                    import logging
                    logging.getLogger(__name__).warning(f"Name overlay failed: {overlay_err}")
                response['image_path'] = full_opener_path
            
            response['text'] = opener_text
            # FIX: outreach sessions go to OUTREACH_PART1 so replies are handled correctly
            new_state = STATE_OUTREACH_PART1 if is_outreach else STATE_OPENER_SENT

        elif current_state == STATE_OUTREACH_PART1:
            # Prospect replied to our outreach opener.
            # Use the user-configured chatflow as the strict, absolute-priority script.
            # Analyze what they said, figure out where we are in the script, send the next step.
            outreach_prompt = self._get_dynamic_prompt(assets, session['id'])
            history = self._get_conversation_history(session['id'], limit=10)
            history.append({'role': 'user', 'content': message_text})
            response['text'] = self.text_gen.generate_reply(
                history, outreach_prompt, model=assets.get('model_name')
            )
            new_state = STATE_OUTREACH_PART1  # stay in Part 1 until they type START

        elif current_state == STATE_OPENER_SENT:
            # User replied to opener. Check for immediate escalation
            last_user_msg = message_text.lower()
            escalate_keywords = ['pic', 'picture', 'photo', 'send', 'see', 'show', 'nude', 'hot', 'sexy', 'breast', 'boobs', 'tits']
            should_escalate = any(keyword in last_user_msg for keyword in escalate_keywords)
            
            if should_escalate:
                # Immediate escalation - use config chatflow as guide
                base_cfg = assets.get('system_prompt') or DEFAULT_SYSTEM_PROMPT
                chatflow_ctx = f"\n\n### CHATFLOW GUIDE ###\n{assets['example_chatflow']}" if assets.get('example_chatflow') else ""
                system_prompt = (
                    f"{base_cfg}{chatflow_ctx}\n\n"
                    "The user is asking for photos. Ask what their 'type' is so you can pick the right pic."
                    + BREVITY_RULE
                )
                history = self._get_conversation_history(session['id'], limit=5)
                history.append({'role': 'user', 'content': message_text})
                
                response['text'] = self.text_gen.generate_reply(history, system_prompt, model=assets.get('model_name'))
                new_state = STATE_PREF_ASKED
            else:
                # ENGAGE SMALL TALK instead of jumping to sales.
                # Use consolidated prompt logic
                dynamic_prompt = self._get_dynamic_prompt(assets, session['id'])
                
                # Fetch history (last 10 messages)
                history = self._get_conversation_history(session['id'], limit=10)
                # Add current user message
                history.append({'role': 'user', 'content': message_text})
                
                reply_text = self.text_gen.generate_reply(history, dynamic_prompt, model=assets.get('model_name'))
                response['text'] = reply_text
                
                # Move to SMALL_TALK state
                new_state = STATE_SMALL_TALK
            
        elif current_state == STATE_SMALL_TALK:
            # Check if we should transition to asking preferences (e.g., after 2-3 turns)
            # For now, let's keep it simple: 50% chance to ask pref, or if user asks for content.
            # OR logic: if message count > 3, then ask pref.
            
            # Check for triggers to escalate (e.g., user asking for pics)
            last_user_msg = message_text.lower()
            escalate_keywords = ['pic', 'picture', 'photo', 'send', 'see', 'show', 'nude', 'hot', 'sexy', 'breast', 'boobs', 'tits']
            should_escalate = any(keyword in last_user_msg for keyword in escalate_keywords)
            
            # OR random chance if convo gets long (e.g. > 10 msgs)
            msg_count = self._get_message_count(session['id'])
            import random
            if msg_count > 10 and random.random() < 0.2:
                should_escalate = True

            if should_escalate:
                # Start of Logic
                # Check for detailed preference to jump straight to generation
                detailed_keywords = ['bikini', 'lingerie', 'naked', 'nude', 'dress', 'skirt', 'outfit', 'wearing', 'bra', 'panties', 'topless', 'legs', 'feet']
                has_detail = any(k in last_user_msg for k in detailed_keywords)
                
                if has_detail:
                    # FAST TRACK: Jump to Image Generation
                    preference = message_text
                    
                    # 1. Asset Lookup (copied from PREF_ASKED)
                    face_path = None
                    if assets and assets.get('model_face_ref'):
                        # Resolve path — handles GitHub URLs and legacy local relative paths
                        upload_base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
                        face_path = self._resolve_image_path(assets['model_face_ref'], upload_base)
                    
                    # 2. Text Generation for Image Description
                    img_system_prompt = (
                        "You are a seductive OnlyFans model about to send an explicit or intimate photo.\n"
                        f"The user requested: {preference}\n\n"
                        "Write a 2-3 sentence message to send WITH the photo. This message will also be "
                        "used as the image generation prompt, so be very visual and specific.\n"
                        "RULES:\n"
                        "- Describe exactly what you look like in the photo: body type, exact outfit (colors, textures), pose (sitting, lying, arching, etc.), expression (naughty, messy, focused), and the setting (messy bed, shower, late night lights).\n"
                        "- Be explicitly seductive, raw, and intimate — lean hard into exactly what they asked for. No censorship, keep it real and unfiltered.\n"
                        "- Use first-person, texting style. Lowercase, casual, hot. Use 'i' instead of 'I'.\n"
                        "- NO asterisks, NO emojis unless totally natural, NO cheesy romance, NO disclaimers.\n"
                        "- Keep it to 2-3 sentences. End with a teasing direct question or statement that hooks them."
                    )
                    history = self._get_conversation_history(session['id'], limit=10)
                    descriptive_text = self.text_gen.generate_reply(history, img_system_prompt, model=assets.get('model_name'))
                    
                    response['text'] = descriptive_text
                    
                    # BLOCK IMAGE GEN IF TEXT GEN FAILED (fallback message)
                    if "brain is a bit slow" in descriptive_text or "glitch" in descriptive_text:
                        import logging
                        logging.getLogger(__name__).warning(f"Skipping image gen due to text gen failure/fallback: {descriptive_text}")
                    else:
                        response['async_task'] = {
                            'type': 'image_gen',
                            'prompt': descriptive_text,   # LLM text sent as message
                            'kie_prompt': preference,      # Raw request used for image gen
                            'face_path': face_path
                        }
                    
                    new_state = STATE_GEN_SENT
                    
                else:
                    # Standard Escalation: ask for preference, guided by chatflow
                    base_cfg = assets.get('system_prompt') or DEFAULT_SYSTEM_PROMPT
                    chatflow_ctx = f"\n\n### CHATFLOW GUIDE ###\n{assets['example_chatflow']}" if assets and assets.get('example_chatflow') else ""
                    system_prompt = (
                        f"{base_cfg}{chatflow_ctx}\n\n"
                        "The user is engaged. Transition naturally to asking their preference "
                        "(what vibe/style they want in a photo). Keep it flirty and casual."
                        + BREVITY_RULE
                    )
                    history = self._get_conversation_history(session['id'], limit=10)
                    history.append({'role': 'user', 'content': message_text})
                    response['text'] = self.text_gen.generate_reply(history, system_prompt, model=assets.get('model_name'))
                    new_state = STATE_PREF_ASKED
            else:
                # Use consolidated prompt logic
                dynamic_prompt = self._get_dynamic_prompt(assets, session['id'])
                
                # History: 10 messages (not 50 — keeps replies short and on-topic)
                history = self._get_conversation_history(session['id'], limit=10)
                history.append({'role': 'user', 'content': message_text})
                
                model_name = assets.get('model_name') if assets and assets.get('model_name') else None
                response['text'] = self.text_gen.generate_reply(history, dynamic_prompt, model=model_name)
                new_state = STATE_SMALL_TALK

        elif current_state == STATE_PREF_ASKED:
            # User replied with preference. Generate Image.
            preference = message_text
            
            face_path = None
            room_path = None
            
            room_path = None
            
            with open("debug_ai.log", "a") as f:
                f.write(f"\n[{datetime.now()}] DEBUG: Preference Input: '{preference}'\n")

            # FILTER: Check for system/bot error messages and Telegram service texts
            forbidden = [
                "verified", "verify", "account", "credential", "login",
                "subscribe", "payment", "card", "spam", "blocked", "restricted",
                "flood", "limit", "banned", "delivered", "failed to send"
            ]
            is_system_msg = any(w in preference.lower() for w in forbidden)
            is_too_short_or_symbolic = len(preference.strip()) < 3
            if is_system_msg or is_too_short_or_symbolic:
                print(f"DEBUG: Filtered invalid preference: {preference}")
                with open("debug_ai.log", "a") as f:
                    f.write(f"[{datetime.now()}] DEBUG: Filtered invalid preference.\n")
                
                # Dynamic request for clarification, using configured persona
                system_prompt = (
                    (assets.get('system_prompt') or DEFAULT_SYSTEM_PROMPT)
                    + "\n\nThe user didn't give a clear photo preference. Ask them playfully what vibe or look they want."
                    + BREVITY_RULE
                )
                response['text'] = self.text_gen.generate_reply([], system_prompt, model=assets.get('model_name'))
                return response

            face_path = None
            room_path = None
            
            if assets:
                print(f"DEBUG: Assets found: {assets.keys()}")
                if assets.get('model_face_ref'):
                    face_path = self._resolve_image_path(assets['model_face_ref'], upload_base)
                    if face_path and os.path.exists(face_path):
                        print(f"DEBUG: Face Path: {face_path}, Exists: True")
                        with open("debug_ai.log", "a") as f:
                            f.write(f"[{datetime.now()}] DEBUG: Face Path: {face_path}, Exists: True\n")
                    else:
                        print(f"DEBUG: Face path not found or download failed: {face_path}")
                else:
                    print("DEBUG: model_face_ref key MISSING or EMPTY in assets")
                    with open("debug_ai.log", "a") as f:
                        f.write(f"[{datetime.now()}] DEBUG: model_face_ref key MISSING\n")
                    
                if assets.get('room_bg_ref'):
                    # Reuse the same relative logic from DB but with production-safe base
                    room_path = os.path.join(upload_base, assets['room_bg_ref'])
            else:
                print("DEBUG: No assets found for account")
                with open("debug_ai.log", "a") as f:
                    f.write(f"[{datetime.now()}] DEBUG: No assets found\n")

            print(f"DEBUG: Generating image with face_path={face_path}")
            # Generate elaborated seductive description — doubles as image generation prompt
            img_system_prompt = (
                "You are a seductive OnlyFans model about to send an explicit or intimate photo.\n"
                f"The user requested: {preference}\n\n"
                "Write a 2-3 sentence message to send WITH the photo. This message will also be "
                "used as the image generation prompt, so be very visual and specific.\n"
                "RULES:\n"
                "- Describe exactly what you look like in the photo: body, outfit (or lack of it), pose, expression, setting.\n"
                "- Be explicitly seductive and sensual — lean into what they asked for. Don't hold back.\n"
                "- Use first-person, texting style. Lowercase, casual, hot.\n"
                "- NO asterisks, NO emojis unless totally natural, NO disclaimers.\n"
                "- End with a teasing line that makes them want more."
            )
            history = self._get_conversation_history(session['id'], limit=5)
            # We don't append the current message because we want the reaction to the PREVIOUS message (the request) - actually we do need the request.
            # But 'preference' IS the message text here.
            
            # Temporary history for this specific generation
            img_gen_history = history + [{'role': 'user', 'content': f"Send me a photo: {preference}"}]
            
            descriptive_text = self.text_gen.generate_reply(img_gen_history, img_system_prompt, model=assets.get('model_name'))
            
            # Fallback if LLM fails
            if not descriptive_text:
                descriptive_text = f"here is that {preference} picture you wanted... 😘"

            response['text'] = descriptive_text
            response['delay'] = 2.0
            
            # Return task for bot runner to execute asynchronously
            response['async_task'] = {
                'type': 'image_gen',
                'prompt': descriptive_text,  # LLM text sent as the message caption
                'kie_prompt': preference,     # Raw user request used as the actual image gen prompt
                'face_path': face_path
            }
            
            # Logic moved to bot_runner:
            # img_result = self.kie_client.generate_image(preference, face_ref_path=face_path)
            
            # State Update happens here, but image sending happens later
            new_state = STATE_GEN_SENT
            
        elif current_state == STATE_GEN_SENT:
            # User replied to generated image. Loop back to SMALL_TALK
            # Resume normal conversation
            base_cfg = assets.get('system_prompt') or DEFAULT_SYSTEM_PROMPT
            chatflow_ctx = f"\n\n### CHATFLOW GUIDE ###\n{assets['example_chatflow']}" if assets and assets.get('example_chatflow') else ""
            system_prompt = (
                f"{base_cfg}{chatflow_ctx}\n\n"
                "You just sent them a hot pic and they replied. Continue naturally. "
                "Be playful, confident. Don't ask if they liked it."
                + BREVITY_RULE
            )
            history = self._get_conversation_history(session['id'], limit=10)
            history.append({'role': 'user', 'content': message_text})
            
            response['text'] = self.text_gen.generate_reply(history, system_prompt, model=assets.get('model_name'))
            new_state = STATE_SMALL_TALK
            
            # Fallback for closed state or unknown
            pass

        # Handle /reset command globally
        if message_text.strip().lower() == '/reset':
            self._reset_session(session['id'])
            return {'text': "Chat reset! Session cleared. Send me a message to start fresh.", 'new_state': None}

        # 3. Update Session & Store Message
        if new_state != current_state:
            print(f"DEBUG: State Transition: {current_state} -> {new_state}")
            with open("debug_ai.log", "a") as f:
                f.write(f"[{datetime.now()}] DEBUG: State Transition: {current_state} -> {new_state}\n")
        
        self._update_session(session['id'], new_state, message_text)
        if not user_msg_logged:
            self._log_message(session['id'], 'user', message_text)
        
        # Calculate delay if there is a text response
        if response.get('text'):
            self._log_message(session['id'], 'assistant', response['text'])
            response['delay'] = self._calculate_delay(response['text'])
        
        response['new_state'] = new_state
        return response

    def _resolve_image_path(self, path_or_url, upload_base):
        """
        Resolve a stored image path to a usable local file path.
        - If it's a /api/assets/image/ proxy path: fetch directly from GitHub API and download.
        - If it's a GitHub/HTTP URL: download to a temp file and return that path.
        - If it's a legacy local relative path: join with upload_base and return.
        Returns None if the path can't be resolved.
        """
        import logging
        logger = logging.getLogger(__name__)

        if not path_or_url:
            return None

        # New proxy URL format: /api/assets/image/assets/{accountId}/{context}/{type}/{filename}
        if str(path_or_url).startswith('/api/assets/image/'):
            # Strip prefix to get the path in the repo (e.g. assets/9/...)
            github_path = str(path_or_url).replace('/api/assets/image/', '')
            
            github_token = os.getenv('GITHUB_TOKEN')
            github_repo = os.getenv('GITHUB_SESSIONS_REPO')
            
            if not github_token or not github_repo:
                logger.error('GITHUB_TOKEN or GITHUB_SESSIONS_REPO not set for direct resolution')
                return None

            api_url = f'https://api.github.com/repos/{github_repo}/contents/{github_path}'
            headers = {
                'Authorization': f'Bearer {github_token}',
                'Accept': 'application/vnd.github.raw',
            }
            
            logger.info(f'Resolving proxy image path via direct GitHub fetch: {api_url}')
            try:
                import requests as _req
                import tempfile
                r = _req.get(api_url, headers=headers, timeout=30)
                if r.ok:
                    suffix = os.path.splitext(github_path.split('?')[0])[-1] or '.jpg'
                    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                    tmp.write(r.content)
                    tmp.close()
                    logger.info(f'Downloaded image from GitHub to temp file: {tmp.name} ({len(r.content)} bytes)')
                    return tmp.name
                else:
                    logger.error(f'Failed to fetch from GitHub API ({r.status_code}): {api_url}')
                    return None
            except Exception as e:
                logger.error(f'Error during direct GitHub fetch: {e}')
                return None

        elif path_or_url.startswith('http://') or path_or_url.startswith('https://'):
            try:
                import requests as _req
                import tempfile
                r = _req.get(path_or_url, timeout=20)
                if r.ok:
                    suffix = os.path.splitext(path_or_url.split('?')[0])[-1] or '.jpg'
                    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                    tmp.write(r.content)
                    tmp.close()
                    logger.info(f'Downloaded image from URL to temp: {tmp.name}')
                    return tmp.name
                else:
                    logger.error(f'Failed to download image from URL ({r.status_code}): {path_or_url}')
                    return None
            except Exception as e:
                logger.error(f'Error downloading image from URL: {e}')
                return None

        else:
            # Legacy local relative path
            resolved = os.path.join(upload_base, path_or_url)
            if os.path.exists(resolved):
                return resolved
            else:
                logger.warning(f'Local image path not found: {resolved}')
                return None


    def _get_session(self, account_id, remote_user_id):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM chat_sessions WHERE account_id = ? AND remote_user_id = ?', (account_id, remote_user_id))
        session = c.fetchone()
        conn.close()
        return session

    def _create_session(self, account_id, remote_user_id, username, initial_state=STATE_OPENER_SENT):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            INSERT INTO chat_sessions (account_id, remote_user_id, username, state)
            VALUES (?, ?, ?, ?)
        ''', (account_id, remote_user_id, username, initial_state))
        conn.commit()
        session_id = c.lastrowid
        conn.close()
        return {'id': session_id, 'state': initial_state}

    def _update_session(self, session_id, new_state, last_message):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('UPDATE chat_sessions SET state = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?', (new_state, session_id))
        conn.commit()
        conn.close()
        
    def _log_message(self, session_id, role, content):
        """Log message to DB for context/history"""
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            # Ensure table exists (migration should handle this, but for safety)
            c.execute('''CREATE TABLE IF NOT EXISTS chat_messages 
                         (id INTEGER PRIMARY KEY, session_id INTEGER, role TEXT, content TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
            
            c.execute('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)', (session_id, role, content))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Failed to log message: {e}")

    def _get_conversation_history(self, session_id, limit=10):
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('''SELECT role, content FROM chat_messages 
                         WHERE session_id = ? ORDER BY created_at DESC LIMIT ?''', (session_id, limit))
            rows = c.fetchall()
            conn.close()
            # Reverse rows to maintain chronological order for the LLM
            return [{'role': r['role'], 'content': r['content']} for r in reversed(rows)]
        except:
            return []

    def _get_custom_image_count(self, session_id):
        """Count how many custom (generated) images have been sent in this session."""
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            # We look for assistant messages in chat_messages that likely correspond to custom images.
            # Custom images in bot_runner are sent with specific excuses or "here u go" patterns.
            # Also, look for GEN_SENT state transitions in history if possible, but simplest is msg content.
            # Note: The true source of truth for image sends is Telethon logs, but DB chat_messages
            # stores the caption/text sent with the image.
            
            # Use specific keywords found in bot_runner.py fallback and success captions.
            keywords = [
                'here u go', 'this one for you', 'phone was acting up', 'camera app crashed',
                'one from earlier', 'one for you', 'hold on my camera', 'technical difficulties',
                'camera app is glitching', 'phone just died'
            ]
            
            query = "SELECT COUNT(*) FROM chat_messages WHERE session_id = ? AND role = 'assistant' AND ("
            query += " OR ".join(["content LIKE ?"] * len(keywords))
            query += ")"
            
            params = [session_id] + [f"%{k}%" for k in keywords]
            
            c.execute(query, params)
            count = c.fetchone()[0]
            conn.close()
            return count
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error counting images: {e}")
            return 0

    def _get_message_count(self, session_id):
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('SELECT COUNT(*) FROM chat_messages WHERE session_id = ?', (session_id,))
            count = c.fetchone()[0]
            conn.close()
            return count
        except:
            return 0

    def _get_account_assets(self, account_id, bot_type='engagement'):
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            
            # 1. Fetch model_assets (Base)
            c.execute('SELECT * FROM model_assets WHERE account_id = ?', (account_id,))
            base_assets_row = c.fetchone()
            base_assets = dict(base_assets_row) if base_assets_row else {}

            # 2. Select config based on bot_type
            if bot_type == 'outreach':
                # Check for Outreach Config
                c.execute('''
                    SELECT ta.active_outreach_config_id, oc.opener_images, oc.model_face_ref, oc.model_body_ref, oc.room_bg_ref,
                           oc.system_prompt, oc.temperature, oc.model_name, oc.model_provider, oc.example_chatflow, 
                           oc.outreach_message, oc.part3_chatflow
                    FROM telegram_accounts ta
                    LEFT JOIN outreach_configs oc ON ta.active_outreach_config_id = oc.id
                    WHERE ta.id = ?
                ''', (account_id,))
                outreach_info = c.fetchone()
                
                if outreach_info and outreach_info['active_outreach_config_id']:
                    merged = {
                        "account_id": account_id,
                        "is_outreach": True,
                        "opener_images": outreach_info['opener_images'] or base_assets.get('opener_images'),
                        "model_face_ref": outreach_info['model_face_ref'] or base_assets.get('model_face_ref'),
                        "model_body_ref": outreach_info['model_body_ref'] or base_assets.get('model_body_ref'),
                        "room_bg_ref": outreach_info['room_bg_ref'] or base_assets.get('room_bg_ref'),
                        "system_prompt": outreach_info['system_prompt'] or base_assets.get('system_prompt'),
                        "temperature": outreach_info['temperature'] if outreach_info['temperature'] is not None else base_assets.get('temperature'),
                        "model_name": outreach_info['model_name'] or base_assets.get('model_name'),
                        "model_provider": outreach_info['model_provider'] or base_assets.get('model_provider'),
                        "example_chatflow": outreach_info['example_chatflow'] or base_assets.get('example_chatflow'),
                        "outreach_message": outreach_info['outreach_message'] or base_assets.get('outreach_message'),
                        "part3_chatflow": outreach_info['part3_chatflow']
                    }
                    conn.close()
                    return merged
            else:
                # Default to engagement (AI Preset)
                c.execute('''
                    SELECT ta.active_config_id, ac.opener_images, ac.model_face_ref, ac.model_body_ref, ac.room_bg_ref,
                           ac.system_prompt, ac.temperature, ac.model_name, ac.model_provider, ac.example_chatflow, ac.outreach_message
                    FROM telegram_accounts ta
                    LEFT JOIN ai_config_presets ac ON ta.active_config_id = ac.id
                    WHERE ta.id = ?
                ''', (account_id,))
                acc_info = c.fetchone()
                
                if acc_info and acc_info['active_config_id']:
                    merged = {
                        "account_id": account_id,
                        "opener_images": acc_info['opener_images'] or base_assets.get('opener_images'),
                        "model_face_ref": acc_info['model_face_ref'] or base_assets.get('model_face_ref'),
                        "model_body_ref": acc_info['model_body_ref'] or base_assets.get('model_body_ref'),
                        "room_bg_ref": acc_info['room_bg_ref'] or base_assets.get('room_bg_ref'),
                        "system_prompt": acc_info['system_prompt'] or base_assets.get('system_prompt'),
                        "temperature": acc_info['temperature'] if acc_info['temperature'] is not None else base_assets.get('temperature'),
                        "model_name": acc_info['model_name'] or base_assets.get('model_name'),
                        "model_provider": acc_info['model_provider'] or base_assets.get('model_provider'),
                        "example_chatflow": acc_info['example_chatflow'] or base_assets.get('example_chatflow'),
                        "outreach_message": acc_info['outreach_message'] or base_assets.get('outreach_message')
                    }
                    conn.close()
                    return merged

            conn.close()
            # No active outreach config found — fall back to base assets but still mark as outreach
            if bot_type == 'outreach':
                base_assets['is_outreach'] = True
                base_assets['account_id'] = account_id
            return base_assets if base_assets else {}
        except Exception as e:
            print(f"Error fetching assets: {e}")
            return {}
            
    def _reset_session(self, session_id):
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('DELETE FROM chat_sessions WHERE id = ?', (session_id,))
            c.execute('DELETE FROM chat_messages WHERE session_id = ?', (session_id,))
            conn.commit()
            conn.close()
            print(f"Session {session_id} reset.")
        except Exception as e:
            print(f"Error resetting session: {e}")
            return None
