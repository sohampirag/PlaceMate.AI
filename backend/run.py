import sys
import traceback
import os

with open('error.log', 'w') as f:
    try:
        import uvicorn
        from main import app
        f.write("Imported app successfully\n")
        f.flush()
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except BaseException as e:
        traceback.print_exc(file=f)
        f.flush()
