
import sys

file_path = "/Users/albertogala/Library/CloudStorage/Dropbox/Alea Antigravity/src/app/praetorium/page.tsx"

with open(file_path, 'r') as f:
    lines = f.readlines()

# 1. Fix Email Modal Closure (around line 4651)
found_email = False
for i in range(4520, 4700):
    if "{showEmailModal && (" in lines[i]:
        found_email = True
        # Find where it should end
        for j in range(i+1, i+200):
            if "</AnimatePresence>" in lines[j] and "</>" in lines[j-1]:
                # Found the location!
                if ")}" not in lines[j-1] and ")}" not in lines[j]:
                    # It's missing the closing )}.
                    # Add it before </AnimatePresence>
                    lines.insert(j, "                )}\n")
                    print(f"Fixed Email Modal closure at line {j+1}")
                break
        break

# 2. Fix Tracking Modal Closure (at the end)
found_tracking = False
for i in range(4650, len(lines)):
    if "{isTrackingModalOpen && (" in lines[i]:
        found_tracking = True
        for j in range(i+1, len(lines)):
            if "</AnimatePresence>" in lines[j]:
                if ")}" not in lines[j-1]:
                    # Add missing closure
                    lines.insert(j, "                    )}\n")
                    print(f"Fixed Tracking Modal closure at line {j+1}")
                break
        break

with open(file_path, 'w') as f:
    f.writelines(lines)
