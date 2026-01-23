import pymysql

try:
    conn = pymysql.connect(
        host='localhost', 
        user='yuva_user',      # <--- Testing new user
        password='yuva321',    # <--- Testing new password
        database='yuva_db'
    )
    print("SUCCESS: Connection works!")
    conn.close()
except Exception as e:
    print("ERROR:", e)