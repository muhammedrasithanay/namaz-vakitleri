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
                if (!res.ok) throw new Error();
                const data = await res.json();
                if (data && data.value) {
                    setProvinces(data.value);
                } else {
                    throw new Error();
                }
            } catch (error) {
                console.error('Provinces fetch error, using static fallback:', error);
                // Map the static CITY_STATE_IDS to the format the modal expects
                const fallbackProvinces = Object.entries(CITY_STATE_IDS).map(([name, id]) => ({
                    SehirAdi: name,
                    SehirID: id
                }));
                setProvinces(fallbackProvinces);
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
            if (!res.ok) throw new Error();
            const data = await res.json();

            if (data && data.value) {
                setDistricts(data.value);
            } else {
                throw new Error();
            }
        } catch (e) {
            console.error('Districts fetch error, acting as single city select:', e);
            // Fallback: treat city as its own primary district
            onCitySelect({
                city: province.SehirAdi,
                name: province.SehirAdi,
                districtId: province.SehirID
            });
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
                padding: '24px', position: 'relative', maxWidth: '400px', width: '90%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
                borderRadius: '24px', display: 'flex', flexDirection: 'column',
                maxHeight: '85vh', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px', color: '#1a1a1a', textAlign: 'center', position: 'relative', letterSpacing: '-0.5px' }}>
                    {selectedProvince && (
                        <button
                            onClick={handleBackClick}
                            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '1.5rem', color: '#145da0', cursor: 'pointer', padding: '0 8px' }}
                        >
                            ←
                        </button>
                    )}
                    {selectedProvince ? `${selectedProvince.SehirAdi}` : 'Şehir Seçimi'}
                </h2>

                {/* Search Box */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={selectedProvince ? "İlçe ara..." : "Şehir ara..."}
                        style={{
                            width: '100%', padding: '14px 20px',
                            backgroundColor: '#f2f2f7', border: 'none', borderRadius: '16px', outline: 'none',
                            fontSize: '1rem', color: '#000'
                        }}
                        disabled={loadingCity}
                    />
                </div>

                {/* List Container */}
                <div className="custom-scrollbar" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loadingCity ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#8e8e93', fontWeight: 500 }}>
                            Yükleniyor...
                        </div>
                    ) : selectedProvince ? (
                        filteredDistricts.length > 0 ? (
                            filteredDistricts.map(district => (
                                <button
                                    key={district.IlceID}
                                    onClick={() => handleDistrictClick(district)}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '18px 20px', backgroundColor: '#fcfcfc',
                                        borderRadius: '16px', transition: 'all 0.2s', fontWeight: 500, color: '#333', border: '1px solid #f2f2f7', cursor: 'pointer',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    {district.IlceAdi}
                                </button>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#8e8e93' }}>Sonuç bulunamadı</div>
                        )
                    ) : filteredProvinces.length > 0 ? (
                        filteredProvinces.map(city => (
                            <button
                                key={city.SehirID}
                                onClick={() => handleCityClick(city)}
                                style={{
                                    width: '100%', textAlign: 'left', padding: '18px 20px', backgroundColor: '#fcfcfc',
                                    borderRadius: '16px', transition: 'all 0.2s', fontWeight: 500, color: '#333', border: '1px solid #f2f2f7', cursor: 'pointer',
                                    fontSize: '1.1rem'
                                }}
                            >
                                {city.SehirAdi}
                            </button>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#8e8e93' }}>Sonuç bulunamadı</div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        marginTop: '20px', width: '100%', padding: '16px', backgroundColor: '#145da0', color: '#fff',
                        fontWeight: 700, borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '1.1rem'
                    }}
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
