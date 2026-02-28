import React, { useState } from 'react';

// Official Diyanet State IDs (Mapping for 81 Cities from 'ven')
const CITY_STATE_IDS = {
    "ADANA": "500", "ADIYAMAN": "501", "AFYONKARAHİSAR": "502", "AĞRI": "503", "AKSARAY": "504", "AMASYA": "505", "ANKARA": "506", "ANTALYA": "507", "ARDAHAN": "508", "ARTVİN": "509", "AYDIN": "510", "BALIKESİR": "511", "BARTIN": "512", "BATMAN": "513", "BAYBURT": "514", "BİLECİK": "515", "BİNGÖL": "516", "BİTLİS": "517", "BOLU": "518", "BURDUR": "519", "BURSA": "520", "ÇANAKKALE": "521", "ÇANKIRI": "522", "ÇORUM": "523", "DENİZLİ": "524", "DİYARBAKIR": "525", "DÜZCE": "526", "EDİRNE": "527", "ELAZIĞ": "528", "ERZİNCAN": "529", "ERZURUM": "530", "ESKİŞEHİR": "531", "GAZİANTEP": "532", "GİRESUN": "533", "GÜMÜŞHANE": "534", "HAKKARİ": "535", "HATAY": "536", "IĞDIR": "537", "ISPARTA": "538", "İSTANBUL": "539", "İZMİR": "540", "KAHRAMANMARAŞ": "541", "KARABÜK": "542", "KARAMAN": "543", "KARS": "544", "KASTAMONU": "545", "KAYSERİ": "546", "KİLİS": "547", "KIRIKKALE": "548", "KIRKLARELİ": "549", "KIRŞEHİR": "550", "KOCAELİ": "551", "KONYA": "552", "KÜTAHYA": "553", "MALATYA": "554", "MANİSA": "555", "MARDİN": "556", "MERSİN": "557", "MUĞLA": "558", "MUŞ": "559", "NEVŞEHİR": "560", "NİĞDE": "561", "ORDU": "562", "OSMANİYE": "563", "RİZE": "564", "SAKARYA": "565", "SAMSUN": "566", "ŞANLIURFA": "567", "SİİRT": "568", "SİNOP": "569", "ŞIRNAK": "570", "SİVAS": "571", "TEKİRDAĞ": "572", "TOKAT": "573", "TRABZON": "574", "TUNCELİ": "575", "UŞAK": "576", "VAN": "577", "YALOVA": "578", "YOZGAT": "579", "ZONGULDAK": "580"
};

const TURKEY_CITIES = Object.keys(CITY_STATE_IDS).sort((a, b) => a.localeCompare(b, 'tr'));
const API_BASE = 'https://ezanvakti.imsakiyem.com/api';
const PROXY = 'https://api.allorigins.win/get?url=';

function CitySearchModal({ onClose, onCitySelect }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingCity, setLoadingCity] = useState(true);

    // States for emushaf API Selection
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [districts, setDistricts] = useState([]);

    React.useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await fetch('https://ezanvakti.emushaf.net/sehirler/2');
                const data = await res.json();
                if (data && data.value) {
                    setProvinces(data.value);
                }
            } catch (error) {
                console.error('Provinces fetch error:', error);
            } finally {
                setLoadingCity(false);
            }
        };
        fetchProvinces();
    }, []);

    const filteredProvinces = provinces.filter(p => p.SehirAdi.toLocaleUpperCase('tr-TR').includes(searchTerm.toLocaleUpperCase('tr-TR')));
    const filteredDistricts = districts.filter(d => d.IlceAdi.toLocaleUpperCase('tr-TR').includes(searchTerm.toLocaleUpperCase('tr-TR')));

    const handleCityClick = async (province) => {
        setSelectedProvince(province);
        setSearchTerm(''); // Clear search box for district search
        setLoadingCity(true);
        try {
            const res = await fetch(`https://ezanvakti.emushaf.net/ilceler/${province.SehirID}`);
            const data = await res.json();

            if (data && data.value) {
                setDistricts(data.value);
            } else {
                throw new Error();
            }
        } catch (e) {
            console.error('Districts fetch error:', e);
            // Fallback
            onCitySelect({ city: province.SehirAdi, name: province.SehirAdi, districtId: province.SehirID });
            onClose();
        } finally {
            setLoadingCity(false);
        }
    };

    const handleDistrictClick = (district) => {
        onCitySelect({
            city: selectedProvince.SehirAdi,
            name: district.IlceAdi,
            districtId: district.IlceID
        });
        onClose();
    };

    const handleBackClick = () => {
        setSelectedProvince(null);
        setDistricts([]);
        setSearchTerm('');
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-box" style={{
                padding: '24px', position: 'relative', maxWidth: '380px', width: '100%',
                backgroundColor: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column',
                maxHeight: '85vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: '#1f2937', textAlign: 'center', position: 'relative' }}>
                    {selectedProvince && (
                        <button
                            onClick={handleBackClick}
                            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '1.2rem', color: '#3b82f6', cursor: 'pointer', padding: '0 8px' }}
                        >
                            ←
                        </button>
                    )}
                    {selectedProvince ? `${selectedProvince.SehirAdi} Seçimi` : 'Bir Şehir Seçin'}
                </h2>

                {/* Search Box */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                        🔍
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={selectedProvince ? "İlçe ara..." : "Şehir ara..."}
                        style={{
                            width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px',
                            backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', outline: 'none',
                            transition: 'background-color 0.2s, border-color 0.2s', color: '#1f2937'
                        }}
                        disabled={loadingCity}
                    />
                </div>

                {/* List Container */}
                <div className="custom-scrollbar" style={{ overflowY: 'auto', flex: 1, paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loadingCity ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontWeight: 500 }}>
                            İlçeler yükleniyor...
                        </div>
                    ) : selectedProvince ? (
                        filteredDistricts.length > 0 ? (
                            filteredDistricts.map(district => (
                                <button
                                    key={district.IlceID}
                                    onClick={() => handleDistrictClick(district)}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '16px 20px', backgroundColor: '#f9fafb',
                                        borderRadius: '12px', transition: 'all 0.2s', fontWeight: 500, color: '#374151', border: 'none', cursor: 'pointer'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.color = '#374151'; }}
                                >
                                    {district.IlceAdi}
                                </button>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>Sonuç bulunamadı</div>
                        )
                    ) : filteredProvinces.length > 0 ? (
                        filteredProvinces.map(city => (
                            <button
                                key={city.SehirID}
                                onClick={() => handleCityClick(city)}
                                style={{
                                    width: '100%', textAlign: 'left', padding: '16px 20px', backgroundColor: '#f9fafb',
                                    borderRadius: '12px', transition: 'all 0.2s', fontWeight: 500, color: '#374151', border: 'none', cursor: 'pointer'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.color = '#374151'; }}
                            >
                                {city.SehirAdi}
                            </button>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>Sonuç bulunamadı</div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        marginTop: '16px', width: '100%', padding: '12px', backgroundColor: '#f3f4f6', color: '#374151',
                        fontWeight: 600, borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                    disabled={loadingCity}
                >
                    Vazgeç
                </button>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 10px; }
            `}</style>
        </div>
    );
}

export default CitySearchModal;
