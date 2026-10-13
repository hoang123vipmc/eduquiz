import json

har_path = r'd:\OneDrive\Máy tính\NguyenThanhBinh\Data-qiz\data.har'

with open(har_path, 'r', encoding='utf-8') as f:
    har_data = json.load(f)

for i, entry in enumerate(har_data['log']['entries']):
    req_url = entry['request']['url']
    resp = entry['response']
    content = resp.get('content', {})
    text = content.get('text', '')
    
    if text:
        try:
            data = json.loads(text)
            # Check if it has something like an array of questions or similar
            # Let's just print URLs with large JSON responses or arrays
            if isinstance(data, list) and len(data) == 371:
                print(f"Found exactly 371 items in list from {req_url}")
                with open('questions.json', 'w', encoding='utf-8') as out:
                    json.dump(data, out, ensure_ascii=False, indent=2)
                break
            
            # Or if it's a dict that contains a list of 371
            if isinstance(data, dict):
                for key, val in data.items():
                    if isinstance(val, list) and len(val) == 371:
                        print(f"Found exactly 371 items in dict key '{key}' from {req_url}")
                        with open('questions.json', 'w', encoding='utf-8') as out:
                            json.dump(val, out, ensure_ascii=False, indent=2)
                        break
                    
                    if isinstance(val, dict):
                         for k2, v2 in val.items():
                             if isinstance(v2, list) and len(v2) == 371:
                                print(f"Found exactly 371 items in dict key '{key}.{k2}' from {req_url}")
                                with open('questions.json', 'w', encoding='utf-8') as out:
                                    json.dump(v2, out, ensure_ascii=False, indent=2)
                                break
                                
        except json.JSONDecodeError:
            pass
        except Exception as e:
            pass
            
print("Done processing")
