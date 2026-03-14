
import sys

file_path = "/Users/albertogala/Library/CloudStorage/Dropbox/Alea Antigravity/src/app/praetorium/page.tsx"

with open(file_path, 'r') as f:
    lines = f.readlines()

# Fixing all tab closures.
# Each tab should end with: 
#   )
# )} (if there's a map)
# or just )} 

# Let's fix the Assets tab specifically.
# Assets ends around 3360.
for i in range(3200, 3400):
    if "activeTab === \"assets\" && (" in lines[i]:
        # Find the closure before "profile"
        for j in range(i+1, i+200):
            if "activeTab === \"profile\"" in lines[j]:
                # We need to ensure the block before j closes the assets tab.
                # It should look like:
                # </div> (closes the card)
                # )} (closes activeTab === "assets")
                
                # Let's rewrite lines around j-5 to j.
                lines[j-5:j] = [
                    "                                                </div>\n",
                    "                                            )}\n",
                    "\n"
                ]
                print(f"Fixed Assets tab closure at line {j}")
                break
        break

# Repeat for other problematic tabs if necessary.
# Profile ends before Intelligence.
for i in range(3370, 3430):
    if "activeTab === \"profile\" && (" in lines[i]:
        for j in range(i+1, i+100):
            if "activeTab === \"intelligence\"" in lines[j]:
                lines[j-5:j] = [
                    "                                                </div>\n",
                    "                                            )}\n",
                    "\n"
                ]
                print(f"Fixed Profile tab closure at line {j}")
                break
        break

# Intelligence ends before Audit.
# Intelligence uses components, so it might be different.
# Audit ends before Agents.
for i in range(3430, 3460):
    if "activeTab === \"audit\" && (" in lines[i]:
        for j in range(i+1, i+100):
            if "activeTab === \"agents\"" in lines[j]:
                lines[j-5:j] = [
                    "                                                </div>\n",
                    "                                            )}\n",
                    "\n"
                ]
                print(f"Fixed Audit tab closure at line {j}")
                break
        break

with open(file_path, 'w') as f:
    f.writelines(lines)
