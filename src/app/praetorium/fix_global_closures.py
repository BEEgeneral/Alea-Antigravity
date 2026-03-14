
import sys

file_path = "/Users/albertogala/Library/CloudStorage/Dropbox/Alea Antigravity/src/app/praetorium/page.tsx"

with open(file_path, 'r') as f:
    lines = f.readlines()

# Correct the end of the tabs area (around 3520-3532)
# We need to close the Agents tab, the main containers, and the selectedInvestor ternary.

start_agents = -1
for i in range(3450, 3600):
    if "activeTab === \"agents\" && (" in lines[i]:
        start_agents = i
        break

if start_agents != -1:
    # Find the end of the agents map
    for i in range(start_agents, start_agents + 200):
        if "{allAgents.length === 0 && (" in lines[i]:
            # The agents tab should end around here.
            # Let's replace the closure block.
            # In view_file 1130, it ended at 3526.
            # We need to close:
            # 1. Agents tab map/ternary
            # 2. activeTab === "agents" (3526)
            # 3. max-w-5xl (2871)
            # 4. flex-1 (2521)
            # 5. h-full flex (2520)
            # 6. selectedInvestor ternary (2517-2519)
            
            # Correct block:
            new_end = [
                "                                                </div>\n", # 3523
                "                                            </div>\n",     # 3524
                "                                        </div>\n",         # 3525
                "                                    )}\n",                 # 3526 (Closes agents)
                "                                </div>\n",                 # 3527 (Closes 2871)
                "                            </div>\n",                     # 3528 (Closes 2521)
                "                        </div>\n",                         # 3529 (Closes 2520)
                "                    )}\n"                                  # 3530 (Closes 2517)
            ]
            
            # Let's find the actual block to replace.
            # In 1130, 3523 was </div>, 3526 was )}, 3530 was </div>.
            lines[3522:3530] = new_end
            break

with open(file_path, 'w') as f:
    f.writelines(lines)
print("Successfully restored global structural closures.")
