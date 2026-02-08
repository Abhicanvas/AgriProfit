import pandas as pd
import sys

# Read the parquet file
df = pd.read_parquet('agmarknet_daily_10yr.parquet')

print("=" * 80)
print("PARQUET FILE ANALYSIS")
print("=" * 80)

print(f"\nShape: {df.shape[0]} rows × {df.shape[1]} columns")

print("\n" + "=" * 80)
print("COLUMNS")
print("=" * 80)
print(df.columns.tolist())

print("\n" + "=" * 80)
print("DATA TYPES")
print("=" * 80)
print(df.dtypes)

print("\n" + "=" * 80)
print("FIRST 5 ROWS")
print("=" * 80)
print(df.head())

print("\n" + "=" * 80)
print("SAMPLE UNIQUE VALUES")
print("=" * 80)
for col in df.columns:
    unique_count = df[col].nunique()
    print(f"\n{col}: {unique_count} unique values")
    if unique_count < 20:
        print(f"  Values: {df[col].unique()[:10].tolist()}")
    else:
        print(f"  Sample: {df[col].unique()[:5].tolist()}")

print("\n" + "=" * 80)
print("DATE RANGE")
print("=" * 80)
date_cols = [col for col in df.columns if 'date' in col.lower() or df[col].dtype == 'datetime64[ns]']
for col in date_cols:
    print(f"{col}: {df[col].min()} to {df[col].max()}")

print("\n" + "=" * 80)
print("NULL VALUES")
print("=" * 80)
print(df.isnull().sum())
