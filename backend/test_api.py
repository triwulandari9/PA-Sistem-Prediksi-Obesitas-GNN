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

        payload = {
            "gender": 0,
            "age": 22,
            "family_history": 0,
            "high_calorie_food": 0,
            "vegetable_consumption": 3,
            "meal_per_day": 3,
            "snacking": 1,
            "smoking": 0,
            "water_intake": 3,
            "calorie_monitoring": 1,
            "physical_activity": 3,
            "screen_time": 0,
            "alcohol": 0,
            "transport": 4
        }
        response = self.app.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn(data['prediction'], ['Rendah', 'Sedang', 'Tinggi'])
        self.assertIn('probabilities', data)
        self.assertIn('recommendations', data)
        self.assertTrue(len(data['recommendations']) > 0)
        print(f"[PASSED] Healthy sample prediction: {data['prediction']} ({data['risk_level']}), Probs: {data['probabilities']}")

    def test_prediction_indonesian_payload(self):

        payload = {
            "umur": 23,
            "jenis_kelamin": 1,
            "riwayat_obesitas": 0,
            "kat_makan_berkalori": 0,
            "kat_makan_sayur": 3,
            "jml_makan_utama": 3,
            "kat_makan_cemilan": 2,
            "kat_merokok": 0,
            "jml_konsum_air": 3,
            "monitoring_kalori": 1,
            "frek_aktivitas_fisik": 2,
            "durasi_penggunaan_gadget": 1,
            "kat_konsum_alkohol": 3,
            "jenis_transportasi": 4
        }
        response = self.app.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn(data['prediction'], ['Rendah', 'Sedang', 'Tinggi'])
        self.assertEqual(data['input_features']['umur'], 23)
        self.assertEqual(data['input_features']['jenis_kelamin'], 1)
        print(f"[PASSED] Indonesian ERD payload test OK: {data['prediction']} ({data['risk_level']})")

    def test_prediction_high_risk_profile(self):

        payload = {
            "gender": 1,
            "age": 45,
            "family_history": 1,
            "high_calorie_food": 1,
            "vegetable_consumption": 1,
            "meal_per_day": 3,
            "snacking": 3,
            "smoking": 1,
            "water_intake": 1,
            "calorie_monitoring": 0,
            "physical_activity": 0,
            "screen_time": 2,
            "alcohol": 2,
            "transport": 0
        }
        response = self.app.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn(data['prediction'], ['Rendah', 'Sedang', 'Tinggi'])
        self.assertIn('probabilities', data)
        self.assertIn('recommendations', data)
        print(f"[PASSED] High risk sample prediction: {data['prediction']} ({data['risk_level']}), Probs: {data['probabilities']}")

    def test_invalid_input(self):

        payload = {"age": -5}
        response = self.app.post('/api/predict', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        print("[PASSED] Invalid age validation test OK")

if __name__ == '__main__':
    unittest.main()
