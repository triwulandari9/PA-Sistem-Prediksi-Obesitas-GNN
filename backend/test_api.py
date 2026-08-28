import unittest
import json
from app import app

class TestObesityFlaskAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_health_check(self):
        response = self.app.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertTrue(data['model_loaded'])
        self.assertEqual(len(data['features']), 14)
        print("\n[PASSED] Health check endpoint OK")

    def test_prediction_low_risk_profile(self):
        # Profil gaya hidup sehat
        payload = {
            "gender": 0,               # Wanita
            "age": 22,                 # Usia 22
            "family_history": 0,       # Tidak ada riwayat keluarga
            "high_calorie_food": 0,    # Jarang konsumsi kalori tinggi
            "vegetable_consumption": 3,# Selalu makan sayur
            "meal_per_day": 3,         # 3x makan
            "snacking": 1,             # Kadang ngemil
            "smoking": 0,              # Tidak merokok
            "water_intake": 3,         # >2L air
            "calorie_monitoring": 1,   # Memantau kalori
            "physical_activity": 3,    # Aktif 4-5 hari
            "screen_time": 0,          # 0-2 jam gadget
            "alcohol": 0,              # Tidak minum alkohol
            "transport": 4             # Jalan kaki
        }
        response = self.app.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn(data['prediction'], ['LOW', 'MEDIUM', 'HIGH'])
        self.assertIn('probabilities', data)
        self.assertIn('recommendations', data)
        self.assertTrue(len(data['recommendations']) > 0)
        print(f"[PASSED] Healthy sample prediction: {data['prediction']} ({data['risk_level']}), Probs: {data['probabilities']}")

    def test_prediction_high_risk_profile(self):
        # Profil gaya hidup berisiko
        payload = {
            "gender": 1,               # Pria
            "age": 45,                 # Usia 45
            "family_history": 1,       # Riwayat keluarga overweight
            "high_calorie_food": 1,    # Sering konsumsi kalori tinggi
            "vegetable_consumption": 1,# Tidak pernah makan sayur
            "meal_per_day": 3,         # 3x makan
            "snacking": 3,             # Selalu ngemil
            "smoking": 1,              # Merokok
            "water_intake": 1,         # <1L air
            "calorie_monitoring": 0,   # Tidak memantau kalori
            "physical_activity": 0,    # Sedentary / tidak berolahraga
            "screen_time": 2,          # >5 jam gadget
            "alcohol": 2,              # Sering minum alkohol
            "transport": 0             # Mobil
        }
        response = self.app.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn(data['prediction'], ['LOW', 'MEDIUM', 'HIGH'])
        self.assertIn('probabilities', data)
        self.assertIn('recommendations', data)
        print(f"[PASSED] High risk sample prediction: {data['prediction']} ({data['risk_level']}), Probs: {data['probabilities']}")

    def test_invalid_input(self):
        # Age invalid
        payload = {"age": -5}
        response = self.app.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        print("[PASSED] Invalid age validation test OK")

if __name__ == '__main__':
    unittest.main()
