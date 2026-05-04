import pandas as pd
import numpy as np

# Set a seed so the "random" data is the same every time
np.random.seed(42)

n_rows = 500
data = {
    "Timestamp": pd.date_range(start="2026-01-01", periods=n_rows, freq="h"),
    "Station": np.random.choice(
        ["Mars Alpha", "Lunar Base", "Titan Outpost", "Venus Cloud City"], n_rows
    ),
    "Resource": np.random.choice(
        ["Oxygen", "Water", "Fuel", "Power Cells", "Rations"], n_rows
    ),
    "Quantity": np.random.randint(10, 1000, n_rows),
    "Unit_Cost": np.random.uniform(1.5, 25.0, n_rows).round(2),
    "Status": np.random.choice(
        ["Stable", "Low", "Critical", "Emergency"], n_rows, p=[0.6, 0.2, 0.15, 0.05]
    ),
}

df_gen = pd.DataFrame(data)

# Injecting some "Missing Data" for a realistic challenge
df_gen.loc[np.random.choice(df_gen.index, 20), "Quantity"] = np.nan

# Save to a real CSV file
df_gen.to_csv("space_colony_data.csv", index=False)
print("File 'space_colony_data.csv' has been created with 500 records!")
