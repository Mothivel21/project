import os
import io
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from api/.env if it exists
load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase configuration - these should be set in Vercel environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL and Key must be provided in environment variables.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/api/suppliers', methods=['GET', 'POST'])
def handle_suppliers():
    try:
        supabase = get_supabase()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if request.method == 'GET':
        try:
            response = supabase.table('supplier_master').select('*').execute()
            return jsonify(response.data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    elif request.method == 'POST':
        data = request.json
        try:
            response = supabase.table('supplier_master').insert(data).execute()
            return jsonify(response.data), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

@app.route('/api/vehicles', methods=['GET', 'POST'])
def handle_vehicles():
    try:
        supabase = get_supabase()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if request.method == 'GET':
        try:
            response = supabase.table('vehicle_master').select('*, supplier_master(*)').execute()
            return jsonify(response.data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    elif request.method == 'POST':
        data = request.json
        try:
            response = supabase.table('vehicle_master').insert(data).execute()
            return jsonify(response.data), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

@app.route('/api/export_stock', methods=['GET'])
def export_stock():
    try:
        supabase = get_supabase()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    try:
        # Query joined data
        response = supabase.table('vehicle_master').select('*, supplier_master(*)').execute()
        vehicles = response.data
        
        # Flatten the data for Excel
        flattened_data = []
        for v in vehicles:
            supplier = v.pop('supplier_master', {})
            if supplier:
                # Prefix supplier keys to avoid conflicts and make it clearer
                for k, val in supplier.items():
                    v[f'supplier_{k}'] = val
            flattened_data.append(v)
            
        from openpyxl import Workbook
        wb = Workbook()
        ws = wb.active
        ws.title = 'Stock'
        
        if flattened_data:
            # Write headers
            headers = list(flattened_data[0].keys())
            ws.append(headers)
            
            # Write data rows
            for item in flattened_data:
                ws.append([item.get(h, "") for h in headers])
        
        # Write to Excel in memory
        output = io.BytesIO()
        wb.save(output)
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='Stock_Report.xlsx'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Required for local testing, Vercel uses the app instance directly
if __name__ == '__main__':
    app.run(debug=True)
