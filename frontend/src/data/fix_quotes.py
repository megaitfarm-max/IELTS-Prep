import re

with open('mockTestData.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all smart quotes with regular quotes
content = content.replace('\u2018', "'")  # left single quote
content = content.replace('\u2019', "'")  # right single quote
content = content.replace('\u201c', '"')  # left double quote
content = content.replace('\u201d', '"')  # right double quote
content = content.replace('\u2014', '-')  # em dash
content = content.replace('\u2013', '-')  # en dash

# Remove trailing commas before closing brackets in arrays
content = re.sub(r',(\s*)\]', r'\1]', content)

with open('mockTestData.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ Fixed all smart quotes and trailing commas')
