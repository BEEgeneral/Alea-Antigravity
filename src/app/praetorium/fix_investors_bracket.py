
import sys

file_path = "/Users/albertogala/Library/CloudStorage/Dropbox/Alea Antigravity/src/app/praetorium/page.tsx"

with open(file_path, 'r') as f:
    lines = f.readlines()

# Rewrite the investors tab (2872-3005)
# Ensure perfect structure.

start_investors = -1
for i in range(2850, 2900):
    if "activeTab === \"investors\" && (" in lines[i]:
        start_investors = i
        break

if start_investors != -1:
    # Find the end of the investors tab block
    end_investors = -1
    for i in range(start_investors + 1, start_investors + 200):
        if "activeTab === \"mandatarios\"" in lines[i]:
            # Backtrack to the nearest closure
            for j in range(i-1, i-10, -1):
                if ")} " in lines[j] or ")} \n" in lines[j] or "                                    )}" in lines[j]:
                    end_investors = j + 1
                    break
            break
    
    if end_investors != -1:
        print(f"Rewriting investors tab from line {start_investors+1} to {end_investors}")
        
        # We'll just fix the specific lines around 2904 and 2996.
        # Ensure 2904 logic is clean.
        # Line 2904: ) : (
        # Line 2905: investors.map(...)
        
        # Actually, let's just make sure 2996 is NOT an extra bracket.
        # I'll use the bracket checker logic on the WHOLE file AGAIN and FIX the first error it finds.
        pass

# Actually, I'll just use a more reliable way: find UNCLOSED brackets in the whole file and find their matches.
# I already did that and it said 43 and 2233.
# If I have unclosed 43 and 2233, it means I have REMOVED too many closers at the end.
# If I have an "Unexpected token }" at 2996, it means I have too MANY closers at 2996.

# CONCLUSION: I shifted a closing bracket from line 2996 to the end of the file?
# No, let's just REMOVE the extra } at 2996 and see if 2233/43 get closed!
# YES! If 2996 is an EXTRA }, it will close something EARLIER than intended, leaving the end unclosed.

# Let's fix 2996:
if ")} \n" in lines[2995] or ")}" in lines[2995]:
    lines[2995] = lines[2995].replace(")}", ")")
    print("Reduced closure at line 2996.")

with open(file_path, 'w') as f:
    f.writelines(lines)
