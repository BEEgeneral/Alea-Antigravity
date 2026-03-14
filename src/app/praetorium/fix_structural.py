
import sys

file_path = "/Users/albertogala/Library/CloudStorage/Dropbox/Alea Antigravity/src/app/praetorium/page.tsx"

with open(file_path, 'r') as f:
    lines = f.readlines()

# Fix Assets Tab end (around 3357-3363)
# Currently it looks like:
# 3357:                                                         </div>
# 3358:                                                     )
# 3359:                                                 )
# 3360:                                             )}
# 3361:                                         </div>
# 3362:                                     </div>
# 3363:                                 )}

# It should be:
#                                                         </div>
#                                                     )
#                                                 )
#                                             )}
#                                         </div>
#                                     )}

# Let's find the assets block.
found_assets = False
for i in range(3200, 3400):
    if "activeTab === \"assets\" && (" in lines[i]:
        found_assets = True
        # Look for the end of this block
        for j in range(i+1, i+200):
            if "activeTab === \"profile\"" in lines[j]:
                # Found the start of next tab.
                # The lines before j should be our problematic closure.
                # We need to backtrack from j.
                
                # Let's replace the block from 3357 to 3363 (relative to the file)
                # We know 3363 is current )}. 
                # We want to remove the extra closures.
                
                # Check line 3357 to 3363 directly.
                target_lines = lines[3356:3363]
                print(f"Target lines for fix: {target_lines}")
                
                # Correct lines should be:
                new_lines = [
                    "                                                        </div>\n", # 3357
                    "                                                    )\n",          # 3358
                    "                                                )\n",          # 3359
                    "                                            )}\n",             # 3360
                    "                                        </div>\n",             # 3361
                    "                                    )}\n"                  # 3362
                ]
                # Note: 3363 is removed.
                
                # Wait, let's verify if there are other errors.
                # The total count of lines will change.
                
                # Let's check 3526-3530.
                # They should close the containers.
                # 3526: )}
                # 3527: </div> (2871)
                # 3528: </div> (2521)
                # 3529: </div> (2520)
                # 3530: )} (2517)
                
                # In current file (view_file 1130):
                # 3526: )}
                # 3527: </div>
                # 3528: </div>
                # 3529: </div>
                # 3530: </div>
                
                # Line 3530 is </div> but should be )}.
                
                # Let's apply these fixes.
                lines[3356:3363] = new_lines
                # Re-calculate index for 3530 after removing one line at 3363
                lines[3529] = "                        )}\n" # Line 3530 became 3529
                
                break
        break

if found_assets:
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Successfully fixed structural integrity.")
else:
    print("Could not find assets tab block.")
    sys.exit(1)
