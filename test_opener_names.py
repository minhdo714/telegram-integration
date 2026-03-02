import sys, os
sys.path.insert(0, 'workers')
from ai_handler import AIHandler

handler = AIHandler()

# Test 1: With first_name
print('=== Test 1: first_name=Mike ===')
result = handler.handle_message(9, 999999, 'hey', username='Mike', bot_type='outreach')
if result:
    text = result.get('text', '')
    print(f'Text: {text}')
    print(f'Contains "Mike": {"Mike" in text}')
    print(f'Image path: {result.get("image_path", "None")}')
else:
    print('No result')

# Test 2: With @username
print()
print('=== Test 2: username=@john_doe ===')
result2 = handler.handle_message(9, 999998, 'hello', username='@john_doe', bot_type='outreach')
if result2:
    text = result2.get('text', '')
    print(f'Text: {text}')
    print(f'Contains "john_doe": {"john_doe" in text}')
else:
    print('No result')

# Test 3: No name at all
print()
print('=== Test 3: username=None ===')
result3 = handler.handle_message(9, 999997, 'hi', username=None, bot_type='outreach')
if result3:
    text = result3.get('text', '')
    print(f'Text: {text}')
    has_placeholder = '{{name}}' in text
    print(f'No leftover placeholder: {not has_placeholder}')
else:
    print('No result')
