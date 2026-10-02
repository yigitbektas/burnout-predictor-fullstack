# BurnoutCheck

BurnoutCheck, yaşam tarzı, çalışma koşulları ve ruh hâliyle ilgili bilgileri kullanarak tükenmişlik riskini tahmin eden uçtan uca bir mobil uygulama prototipidir. Uygulama, **Mental Health & Burnout Prediction Dataset** üzerinde temizlenip eğitilmiş Random Forest modelinden yararlanır ve değerlendirme sonunda 0–100 arası bir skor ile `Low`, `Moderate` veya `High` risk seviyesi üretir.

> Bu proje bir farkındalık ve eğitim çalışmasıdır; tıbbi teşhis, tedavi veya profesyonel değerlendirme yerine geçmez. Yüksek risk sonucu ya da ruh sağlığıyla ilgili kaygı durumunda bir ruh sağlığı uzmanına başvurulmalıdır.

## Veri kaynağı

Modelin eğitiminde Kaggle'da yayımlanan, yaklaşık **40.000 kayıt** içeren [Mental Health & Burnout Prediction Dataset](https://www.kaggle.com/datasets/mobeenfatimah/mental-health-and-burnout-prediction-dataset) kullanılmıştır.

Veri kümesindeki demografik, çalışma, uyku, stres, alışkanlık, sosyal destek ve yaşam memnuniyeti değişkenleri eğitim öncesinde işlenmiş; elde edilen model ve özellik sırası `backend/burnout_model.pkl` içinde saklanmıştır. Ham veri kümesi ve eğitim not defteri bu depoda yer almaz.

## Özellikler

- 33 soruluk, altı adımlı Türkçe değerlendirme formu
- React Native + TypeScript ile mobil uyumlu Expo arayüzü
- Zorunlu alan kontrolü ve ilerleme göstergesi
- FastAPI tabanlı tahmin servisi
- Kategorik veriler için API katmanında kodlama ve one-hot encoding
- 0–100 aralığına sınırlandırılmış final skor
- Renk kodlu sonuç ekranı: düşük, orta ve yüksek risk

## Mimari

```text
React Native / Expo istemcisi
        │  POST /predict (JSON)
        ▼
FastAPI backend
        │  doğrulama + kategorik dönüşümler
        ▼
Random Forest modeli (burnout_model.pkl)
        │
        ▼
Skor, risk seviyesi, açıklama ve renk
```

### Frontend

`frontend/` dizinindeki Expo Router uygulaması tek ekrandan oluşur. `app/index.tsx`, form alanlarını altı bölümde tanımlar ve API'ye uygun türlerde JSON gövdesi oluşturur:

1. Kişisel Bilgiler
2. İş & Uyku
3. Ruh Hali & Aktivite
4. Dijital & Alışkanlıklar
5. Sağlık & Destek
6. Yaşam Sonuçları

İstemci, Android emülatöründe backend'e `http://10.0.2.2:8000/predict` üzerinden bağlanacak şekilde ayarlanmıştır. Fiziksel cihaz veya web için bu adres, backend'in erişilebilen yerel ağ IP'siyle değiştirilmelidir.

### Backend ve model akışı

`backend/main.py`, Pydantic ile gelen 33 alanı doğrular ve modelin beklediği özellikleri üretir:

- Eğitim seviyesi, uyku kalitesi, destek sistemi, stres ve egzersiz sıklığı sıralı sayısal değerlere dönüştürülür.
- Evet/hayır alanları `0` veya `1` olarak kodlanır.
- `Gender`, `Remote_Work` ve `Employment_Status` alanlarına one-hot encoding uygulanır.
- Modelde beklenen fakat istekte bulunmayan sütunlar `0` ile eklenir; sütunlar kaydedilmiş eğitim sırasına getirilir.
- Random Forest tahmini `0.0–100.0` aralığına kırpılır ve iki ondalık basamakla döndürülür.

Risk eşikleri:

| Final skor | Seviye | Renk |
| --- | --- | --- |
| `< 40` | Low | Yeşil |
| `40–69.99` | Moderate | Turuncu |
| `≥ 70` | High | Kırmızı |

## Proje yapısı

```text
burnout_app/
├── backend/
│   ├── main.py                 # FastAPI uygulaması ve tahmin ön işleme akışı
│   └── burnout_model.pkl       # Eğitilmiş Random Forest modeli + özellik sırası
├── frontend/
│   ├── app/
│   │   ├── _layout.tsx         # Expo Router ekran yapılandırması
│   │   └── index.tsx           # Form, istek ve sonuç arayüzü
│   ├── assets/                 # Uygulama ikonları
│   ├── app.json                # Expo yapılandırması
│   └── package.json            # Frontend bağımlılıkları ve komutları
└── README.md
```

## Kurulum ve çalıştırma

### Gereksinimler

- Python 3.10+
- Node.js 18+
- npm
- Expo Go, Android emülatörü veya iOS simülatörü

### 1. Backend'i başlatın

```powershell
cd backend
python -m pip install fastapi "uvicorn[standard]" pandas numpy scikit-learn
python -m uvicorn main:app --reload
```

Servis varsayılan olarak `http://127.0.0.1:8000` adresinde çalışır. API dokümantasyonunu `http://127.0.0.1:8000/docs` adresinde görüntüleyebilirsiniz.

### 2. Frontend'i başlatın

Yeni bir terminalde:

```powershell
cd frontend
npm install
npm start
```

Ardından Expo'nun sunduğu seçeneklerden Android, iOS veya web platformunu açın. Android emülatörü dışındaki bir ortamda çalışıyorsanız `frontend/app/index.tsx` içindeki `API_URL` değerini backend makinesinin erişilebilir adresine göre güncelleyin.

## API

### `POST /predict`

İstemci, formdaki tüm alanları içeren JSON isteğini bu uç noktaya gönderir. Örnek yanıt:

```json
{
  "burnout_score": 58.42,
  "risk_level": "Moderate",
  "risk_label": "You have a moderate risk of burnout. Consider taking preventive measures.",
  "risk_color": "orange"
}
```

`burnout_score` modelin tahminidir; `risk_level`, `risk_label` ve `risk_color` bu skordan backend tarafından türetilir.

## Gizlilik ve sorumlu kullanım

Uygulama mevcut haliyle form verisini yalnızca tahmin isteği içinde backend'e gönderir; kalıcı bir kullanıcı veritabanı veya kimlik doğrulama katmanı içermez. Gerçek kullanıcılarla kullanılacak bir sürümde HTTPS, açık rıza, veri minimizasyonu, güvenli saklama, erişim denetimi ve ilgili veri koruma mevzuatına uygunluk eklenmelidir.

Model sonucu, veri kümesindeki örüntülere dayalı istatistiksel bir tahmindir. Sonuçların klinik karar vermede tek başına kullanılmaması gerekir.

## Teknolojiler

- **Mobil:** React Native, TypeScript, Expo, Expo Router
- **Backend:** Python, FastAPI, Pydantic, Pandas, NumPy
- **Makine öğrenmesi:** scikit-learn Random Forest, pickle
