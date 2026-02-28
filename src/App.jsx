import React, { useState, useEffect, useMemo } from 'react';
import SettingsView from './SettingsView';
import CitySearchModal from './CitySearchModal';
import './App.css';

const TURKISH_NAMES = {
  Fajr: 'İMSAK',
  Sunrise: 'GÜNEŞ',
  Dhuhr: 'ÖĞLE',
  Asr: 'İKİNDİ',
  Maghrib: 'AKŞAM',
  Isha: 'YATSI'
};

const TURKISH_HIJRI_MONTHS = {
  "Muharram": "Muharrem",
  "Safar": "Safer",
  "Rabi' al-awwal": "Rebiülevvel",
  "Rabi' al-thani": "Rebiülahir",
  "Jumada al-awwal": "Cemaziyelevvel",
  "Jumada al-thani": "Cemaziyelahir",
  "Rajab": "Recep",
  "Sha'ban": "Şaban",
  "Ramadan": "Ramazan",
  "Shawwal": "Şevval",
  "Dhu al-Qi'dah": "Zilkade",
  "Dhu al-Hijjah": "Zilhicce"
};

const TURKISH_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TURKISH_DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const API_BASE = 'https://ezanvakti.imsakiyem.com/api';
const PROXY = 'https://api.allorigins.win/get?url=';

const HADITHS = [
  '"Kim bir iyilik yaptığında seviniyor, bir kötülük yaptığında üzülüyorsa o mümindir." (Tirmizî, Fiten, 7)',
  '"İki nimet vardır ki, insanların çoğu onlarda aldanmıştır: Sağlık ve boş vakit." (Buhârî, Rikâk, 1)',
  '"Sizin en hayırlınız, Kur\'an\'ı öğrenen ve öğreteninizdir." (Buhârî, Fezâilü\'l-Kur\'ân, 21)',
  '"Kolaylaştırınız, zorlaştırmayınız; müjdeleyiniz, nefret ettirmeyiniz." (Buhârî, İlm, 11)',
  '"Müslüman, Müslümanın kardeşidir. Ona zulmetmez, onu (düşmana) teslim etmez." (Buhârî, Mezâlim, 3)',
  '"Amellerin en faziletlisi, az da olsa devamlı olanıdır." (Müslim, Müsâfirîn, 218)',
  '"Gerçek zenginlik, mal çokluğu değil, gönül tokluğudur." (Buhârî, Rikâk, 15)',
  '"Mümin, bir delikten iki defa ısırılmaz." (Buhârî, Edeb, 115)',
  '"Kim Allah\'a ve ahiret gününe inanıyorsa, ya hayır söylesin ya da sussun." (Buhârî, Edeb, 31)'
];

function App() {
  const [prayerTimes, setPrayerTimes] = useState(null);

  // Location States
  const [locationName, setLocationName] = useState(localStorage.getItem('locName') || 'İSTANBUL');
  const [districtId, setDistrictId] = useState(localStorage.getItem('distId') || '9541'); // Default İSTANBUL
  const [isGps, setIsGps] = useState(localStorage.getItem('isGps') === 'true');
  const [gpsCoords, setGpsCoords] = useState({
    lat: localStorage.getItem('gpsLat'),
    lon: localStorage.getItem('gpsLon')
  });

  // UI States
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [activeTab, setActiveTab] = useState('vakitler'); // 'vakitler' or 'kible' or 'ayarlar'

  // GPS States managed in App now
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Time States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hijriDate, setHijriDate] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialization effect for Auto GPS
  useEffect(() => {
    // If user hasn't explicitly disabled GPS and we don't have coords yet, try fetching
    if (localStorage.getItem('isGps') !== 'false' && !gpsCoords.lat) {
      if ("geolocation" in navigator) {
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              if (!res.ok) throw new Error();
              const data = await res.json();
              const dist = data.address.county || "";
              const cty = data.address.province || data.address.city || data.address.state || "Bilinmiyor";
              const city = dist && dist !== cty ? `${dist}, ${cty}` : cty;

              setIsGps(true);
              setGpsCoords({ lat: latitude, lon: longitude });
              setLocationName(city);

              localStorage.setItem('isGps', 'true');
              localStorage.setItem('gpsLat', latitude);
              localStorage.setItem('gpsLon', longitude);
              localStorage.setItem('locName', city);
            } catch (e) {
              console.warn("Auto GPS Address lookup failed.");
            } finally {
              setGpsLoading(false);
            }
          },
          () => {
            setGpsLoading(false); // Silent block/fail
          }
        );
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
    if (isGps && gpsCoords.lat && gpsCoords.lon) {
      fetchVakitlerGps(gpsCoords.lat, gpsCoords.lon);
    } else {
      fetchVakitlerDistrict(districtId);
    }
  }, [districtId, isGps, gpsCoords]);


  const fetchVakitlerGps = async (lat, lon) => {
    try {
      // Use Aladhan for coordinates
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=13`);
      if (!res.ok) throw new Error('API failed');

      const data = await res.json();
      const t = data.data.timings;
      setPrayerTimes({
        Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr,
        Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha
      });
      setHijriDate({
        day: data.data.date.hijri.day,
        month: { en: data.data.date.hijri.month.en },
        year: data.data.date.hijri.year
      });
    } catch (e) {
      console.error('GPS fetch failed, falling back to mock');
      setFallbackData();
    }
  };


  const fetchVakitlerDistrict = async (dId) => {
    // emushaf.net directly provides Diyanet official times per district - no proxy needed!
    try {
      const res = await fetch(`https://ezanvakti.emushaf.net/vakitler/${dId}`);
      if (!res.ok) throw new Error('emushaf API failed');

      const data = await res.json();
      if (data && data.value && data.value.length > 0) {
        // Find today's entry
        const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
        const today = data.value.find(d => d.MiladiTarihKisa === todayStr) || data.value[0];

        setPrayerTimes({
          Fajr: today.Imsak,
          Sunrise: today.Gunes,
          Dhuhr: today.Ogle,
          Asr: today.Ikindi,
          Maghrib: today.Aksam,
          Isha: today.Yatsi
        });

        // Parse Hijri date from Turkish string like "11.9.1447"
        if (today.HicriTarihKisa) {
          const parts = today.HicriTarihKisa.split('.');
          if (parts.length >= 3) {
            const monthNum = parseInt(parts[1], 10);
            const TURKISH_HIJRI_MONTH_NAMES = ["", "Muharrem", "Safer", "Rebiülevvel", "Rebiülahir", "Cemaziyelevvel", "Cemaziyelahir", "Recep", "Şaban", "Ramazan", "Şevval", "Zilkade", "Zilhicce"];
            setHijriDate({
              day: parts[0],
              month: { en: TURKISH_HIJRI_MONTH_NAMES[monthNum] || String(monthNum) },
              year: parts[2]
            });
          }
        }
      }
    } catch (e) {
      console.error('emushaf fetch failed, trying Aladhan fallback', e.message);
      // Fallback to Aladhan with city name
      try {
        const res2 = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(locationName)}&country=Turkey&method=13`);
        const data2 = await res2.json();
        if (data2.code === 200) {
          const t = data2.data.timings;
          setPrayerTimes({ Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha });
          setHijriDate({ day: data2.data.date.hijri.day, month: { en: data2.data.date.hijri.month.en }, year: data2.data.date.hijri.year });
        } else throw new Error();
      } catch {
        setFallbackData();
      }
    }
  };

  const [currentCity, setCurrentCity] = useState(localStorage.getItem('currCity') || 'İSTANBUL');

  // Feature States
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') !== 'false');
  const [notifyEnabled, setNotifyEnabled] = useState(localStorage.getItem('notifyEnabled') !== 'false');

  const dailyHadith = useMemo(() => {
    // Simple way to get a consistent index based on the day of the year
    const start = new Date(currentTime.getFullYear(), 0, 0);
    const diff = (currentTime - start) + ((start.getTimezoneOffset() - currentTime.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return HADITHS[dayOfYear % HADITHS.length];
  }, [currentTime]);

  const setFallbackData = () => {
    setPrayerTimes({ Fajr: '05:32', Sunrise: '06:52', Dhuhr: '12:42', Asr: '15:51', Maghrib: '18:24', Isha: '19:38' });
    setHijriDate({ day: '10', month: { en: 'Ramadan' }, year: '1447' });
  };

  const handleSettingsSave = (settings) => {
    // Save Feature States
    if (settings.sound !== undefined) {
      setSoundEnabled(settings.sound);
      localStorage.setItem('soundEnabled', settings.sound);
    }
    if (settings.notify !== undefined) {
      setNotifyEnabled(settings.notify);
      localStorage.setItem('notifyEnabled', settings.notify);
    }

    // Save Location States (if triggered by original modal, though now SettingsView only does Features)
    if (settings.isGps !== undefined) {
      if (settings.isGps) {
        setIsGps(true);
        setGpsCoords({ lat: settings.lat, lon: settings.lon });
        setLocationName(settings.name);

        localStorage.setItem('isGps', 'true');
        localStorage.setItem('gpsLat', settings.lat);
        localStorage.setItem('gpsLon', settings.lon);
        localStorage.setItem('locName', settings.name);
      } else {
        setIsGps(false);
        setLocationName(settings.name);
        setCurrentCity(settings.city);
        setDistrictId(settings.districtId);

        localStorage.setItem('isGps', 'false');
        localStorage.setItem('locName', settings.name);
        localStorage.setItem('currCity', settings.city);
        localStorage.setItem('distId', settings.districtId);

        fetchVakitlerDistrict(settings.districtId);
      }
    }
  };

  const toggleGps = () => {
    const newState = !isGps;
    setGpsError(null);

    if (newState) {
      setGpsLoading(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await res.json();
              const dist = data.address.county || "";
              const cty = data.address.province || data.address.city || data.address.state || "Bilinmiyor";
              const city = dist && dist !== cty ? `${dist}, ${cty}` : cty;

              setIsGps(true);
              setGpsCoords({ lat: latitude, lon: longitude });
              setLocationName(city);

              localStorage.setItem('isGps', 'true');
              localStorage.setItem('gpsLat', latitude);
              localStorage.setItem('gpsLon', longitude);
              localStorage.setItem('locName', city);

              setGpsLoading(false);
            } catch (e) {
              setGpsError("Konum adı bulunamadı.");
              setGpsLoading(false);
            }
          },
          (error) => {
            setGpsError(error.code === 1 ? "Konum izni reddedildi." : "Konum alınamadı.");
            setGpsLoading(false);
          }
        );
      } else {
        setGpsError("Tarayıcınız GPS desteklemiyor.");
        setGpsLoading(false);
      }
    } else {
      setIsGps(false);
      localStorage.setItem('isGps', 'false');
      // Revert to manual district
      fetchVakitlerDistrict(districtId);
    }
  };

  const handleCitySelect = (data) => {
    setIsGps(false);
    setLocationName(data.name);
    setCurrentCity(data.city);
    setDistrictId(data.districtId);

    localStorage.setItem('isGps', 'false');
    localStorage.setItem('locName', data.name);
    localStorage.setItem('currCity', data.city);
    localStorage.setItem('distId', data.districtId);

    fetchVakitlerDistrict(data.districtId);
  };

  const countdownInfo = useMemo(() => {
    if (!prayerTimes) return null;
    const relevantPrayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = currentTime;
    let next = null;
    let activePrayer = null;
    let minDiff = Infinity;

    // Calculate next prayer by strictly finding the first prayer that is still in the future today
    relevantPrayers.forEach(name => {
      const [hours, minutes] = prayerTimes[name].split(':').map(Number);
      const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
      let diff = prayerDate.getTime() - now.getTime();
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        next = { name, time: prayerTimes[name], diff };
      }
    });

    if (!next) {
      const [h, m] = prayerTimes.Fajr.split(':').map(Number);
      const pDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, m, 0, 0);
      next = { name: 'Fajr', time: prayerTimes.Fajr, diff: pDate.getTime() - now.getTime() };
    }

    // Calculate active prayer (the one before 'next')
    const nextIdx = relevantPrayers.indexOf(next.name);
    if (nextIdx === 0) {
      activePrayer = 'Isha'; // If next is Fajr, active is Isha
    } else {
      activePrayer = relevantPrayers[nextIdx - 1];
    }

    const h = Math.floor(next.diff / (1000 * 60 * 60)).toString().padStart(2, '0');
    const m = Math.floor((next.diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const s = Math.floor((next.diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
    return { ...next, activePrayer, formatted: `${h}:${m}:${s}` };
  }, [prayerTimes, currentTime]);

  // Handle Notifications and Sound when countdown hits zero
  useEffect(() => {
    if (countdownInfo && countdownInfo.formatted === '00:00:00') {
      const prayerNameTr = TURKISH_NAMES[countdownInfo.name] || countdownInfo.name;

      // Play Sound
      if (soundEnabled) {
        try {
          const audio = new Audio('https://ezanvakti.imsakiyem.com/assets/sound/ezan.mp3');
          audio.play().catch(e => console.log('Audio play blocked:', e));
        } catch (e) { }
      }

      // Native Push Notification
      if (notifyEnabled && Notification.permission === 'granted') {
        new Notification('Namaz Vakti', {
          body: `${prayerNameTr} vakti girdi.`,
          icon: '/vite.svg'
        });
      }
    }
  }, [countdownInfo, soundEnabled, notifyEnabled]);

  const dateStr = `${currentTime.getDate()} ${TURKISH_MONTHS[currentTime.getMonth()]} ${TURKISH_DAYS[currentTime.getDay()]}`;

  // --- Qibla Calculation ---
  const qiblaAngle = useMemo(() => {
    // Default to Istanbul coordinates if no GPS
    let userLat = 41.0082;
    let userLng = 28.9784;

    if (isGps && gpsCoords.lat && gpsCoords.lon) {
      userLat = parseFloat(gpsCoords.lat);
      userLng = parseFloat(gpsCoords.lon);
    }
    // If not GPS, ideally we need coordinates for the selected district.
    // For simplicity without a huge DB, we use Istanbul as a fallback 
    // or you could add a small city->coord map here.

    const kLat = 21.4225; // Kaaba Lat
    const kLng = 39.8262; // Kaaba Lng

    const latRad = userLat * (Math.PI / 180);
    const kLatRad = kLat * (Math.PI / 180);
    const dLngRad = (kLng - userLng) * (Math.PI / 180);

    const y = Math.sin(dLngRad);
    const x = Math.cos(latRad) * Math.tan(kLatRad) - Math.sin(latRad) * Math.cos(dLngRad);
    let angle = Math.atan2(y, x) * (180 / Math.PI);

    // Normalize to 0-360
    return (angle + 360) % 360;
  }, [isGps, gpsCoords, districtId]);

  return (
    <div className="main-content">

      {showCitySearch && (
        <CitySearchModal
          onClose={() => setShowCitySearch(false)}
          onCitySelect={handleCitySelect}
        />
      )}

      {/* Main Container - Conditional Rendering */}
      <div className="tab-content" style={{ paddingBottom: '80px' }}>
        {activeTab === 'vakitler' && (
          !prayerTimes ? <div className="loading" style={{ marginTop: '50px' }}>Yükleniyor...</div> : (
            <>
              <div className="top-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>

                {/* 1. Next Prayer Label */}
                <h3 className="next-prayer-label" style={{ fontSize: '1.4rem', color: '#333', fontWeight: 400, marginBottom: '0' }}>
                  <span style={{ fontWeight: 600, color: '#145da0' }}>{TURKISH_NAMES[countdownInfo?.name]}</span> vaktine
                </h3>

                {/* 2. Main Countdown */}
                <h1 className="countdown-main" style={{
                  fontSize: '6.5rem', fontWeight: 300, color: '#000', letterSpacing: '-0.02em',
                  lineHeight: 1, margin: '15px 0', fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {countdownInfo?.formatted}
                </h1>

                {/* 3. Location Label */}
                <h2 className="city-label" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#000', marginTop: '5px' }}>
                  {locationName}, Türkiye {isGps && <span style={{ fontSize: '0.9rem', color: '#aaa', marginLeft: '4px' }}>📍</span>}
                </h2>
              </div>

              {/* 4. Date Label */}
              <div className="middle-section" style={{ margin: '35px 0 25px 0' }}>
                <p className="full-date" style={{ fontSize: '1.05rem', color: '#111', fontWeight: 400 }}>
                  {hijriDate && `${hijriDate.day} ${TURKISH_HIJRI_MONTHS[hijriDate.month.en] || hijriDate.month.en} ${hijriDate.year}`} / {dateStr}
                </p>
              </div>
              <div className="bottom-section">
                <div className="horizontal-prayer-list" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '20px' }}>
                  {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
                    const isActive = countdownInfo?.name === prayer;
                    return (
                      <div key={prayer} className={`prayer-item-mini ${isActive ? 'active' : ''}`} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1
                      }}>
                        <span style={{
                          fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: isActive ? '#145da0' : 'var(--text-muted)'
                        }}>
                          {TURKISH_NAMES[prayer]}
                        </span>
                        <span style={{
                          fontSize: '1.1rem', fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#145da0' : 'var(--text-main)'
                        }}>
                          {prayerTimes[prayer]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Hadith Container */}
                <div className="hadith-container">
                  <span style={{ color: 'var(--accent-green)', fontSize: '1.5rem', marginBottom: '8px', display: 'block' }}>❝</span>
                  <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontStyle: 'italic', fontSize: '0.875rem', lineHeight: 1.6 }}>{dailyHadith}</p>
                  <span style={{ color: 'var(--accent-green)', fontSize: '1.5rem', marginTop: '8px', display: 'block' }}>❞</span>
                </div>
              </div>
            </>
          )
        )}

        {activeTab === 'kible' && (
          <div className="qibla-section" style={{ textAlign: 'center', marginTop: '60px' }}>
            <h2 style={{ marginBottom: '30px', color: 'var(--text-main)' }}>Kıble Yönü</h2>
            <div className="compass-circle">
              <div className="compass-arrow" style={{ transform: `rotate(${qiblaAngle}deg)` }}>
                📍
              </div>
            </div>
            <p style={{ marginTop: '30px', fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent-green)' }}>
              Kıble Açısı: {Math.round(qiblaAngle)}°
            </p>
            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Telefonunuzun pusulasını sıfıra (Kuzey'e) hizalayıp<br /> bu açıya göre dönebilirsiniz.
            </p>
            {!isGps && (
              <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#dc3545', background: '#ffe6e6', padding: '10px', borderRadius: '8px' }}>
                Dikkat: Kesin açı için Ayarlar'dan<br /><b>GPS (Otomatik Konum)'i</b> açmanız önerilir.
              </p>
            )}
          </div>
        )}

        {activeTab === 'ayarlar' && (
          <SettingsView
            initialSoundState={soundEnabled}
            initialNotifyState={notifyEnabled}
            initialGpsState={isGps}
            onSaveSettings={handleSettingsSave}
            onToggleGps={toggleGps}
            gpsLoading={gpsLoading}
            gpsError={gpsError}
            onOpenCitySearch={() => setShowCitySearch(true)}
            locationName={locationName}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'vakitler' ? 'active' : ''}`} onClick={() => setActiveTab('vakitler')}>
          ⏱️
          <span>Vakitler</span>
        </button>
        <button className={`nav-item ${activeTab === 'kible' ? 'active' : ''}`} onClick={() => setActiveTab('kible')}>
          🧭
          <span>Kıble</span>
        </button>
        <button className={`nav-item ${activeTab === 'ayarlar' ? 'active' : ''}`} onClick={() => setActiveTab('ayarlar')}>
          ⚙️
          <span>Ayarlar</span>
        </button>
      </nav>

    </div>
  );
}

export default App;
