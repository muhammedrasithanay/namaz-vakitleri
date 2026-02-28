import React, { useState } from 'react';

function SettingsView({ initialSoundState, initialNotifyState, initialGpsState, onSaveSettings, onToggleGps, gpsLoading, gpsError, onOpenCitySearch, locationName }) {
    const [soundEnabled, setSoundEnabled] = useState(initialSoundState !== false);
    const [notifyEnabled, setNotifyEnabled] = useState(initialNotifyState !== false);

    const handleNotifyToggle = async (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Bildirim izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.');
                setNotifyEnabled(false);
                return;
            }
        }
        setNotifyEnabled(isChecked);
        onSaveSettings({ sound: soundEnabled, notify: isChecked });
    };

    const handleSoundToggle = (e) => {
        const isChecked = e.target.checked;
        setSoundEnabled(isChecked);
        onSaveSettings({ sound: isChecked, notify: notifyEnabled });
    };

    return (
        <div className="settings-section" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            padding: '24px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6', minHeight: '400px', width: '100%', maxWidth: '380px', margin: '24px auto 96px auto',
            animation: 'fadeIn 0.4s ease-out'
        }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '32px', color: '#1f2937', letterSpacing: '-0.025em' }}>Ayarlar</h2>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* City Selection */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb',
                    padding: '16px', borderRadius: '16px', border: '1px solid #f3f4f6', transition: 'box-shadow 0.2s',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'pointer'
                }}
                    onClick={onOpenCitySearch}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                >
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.125rem' }}>Şehir Seç</h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>{locationName || "Şehir seçin"}</p>
                    </div>
                    <span style={{ fontSize: '1.5rem', color: '#9ca3af', lineHeight: 1 }}>›</span>
                </div>

                {/* GPS Settings */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eff6ff',
                    padding: '16px', borderRadius: '16px', border: '1px solid #dbeafe', transition: 'box-shadow 0.2s',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                >
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontWeight: 600, color: '#1e3a8a', fontSize: '1.125rem' }}>Otomatik Konum</h3>
                        <p style={{ fontSize: '0.875rem', color: '#1d4ed8', marginTop: '4px' }}>
                            {gpsLoading ? "Bulunuyor..." : (initialGpsState ? "Aktif" : "Kapalı")}
                        </p>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={initialGpsState} onChange={onToggleGps} disabled={gpsLoading} />
                        <span className="slider round"></span>
                    </label>
                </div>
                {gpsError && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px', fontWeight: 500, padding: '0 8px', textAlign: 'left' }}>⚠️ {gpsError}</p>}

                {/* Sound Settings */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb',
                    padding: '16px', borderRadius: '16px', border: '1px solid #f3f4f6', transition: 'box-shadow 0.2s',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                >
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.125rem' }}>Ezan Sesi</h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>Vakit girdiğinde ses çal</p>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={soundEnabled} onChange={handleSoundToggle} />
                        <span className="slider round"></span>
                    </label>
                </div>

                {/* Notifications Settings */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb',
                    padding: '16px', borderRadius: '16px', border: '1px solid #f3f4f6', transition: 'box-shadow 0.2s',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                >
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.125rem' }}>Bildirimler</h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>Masaüstü/Telefon bildirimi al</p>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={notifyEnabled} onChange={handleNotifyToggle} />
                        <span className="slider round"></span>
                    </label>
                </div>

                {/* Language Info */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb',
                    padding: '16px', borderRadius: '16px', border: '1px solid #f3f4f6', marginTop: '24px'
                }}>
                    <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.125rem' }}>Dil (Language)</span>
                    <span style={{ color: '#3b82f6', fontWeight: 500 }}>Türkçe</span>
                </div>
            </div>

            <div style={{ marginTop: '48px', textAlign: 'center', opacity: 0.6 }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500, letterSpacing: '0.025em' }}>Sürüm v1.0 | MRH</p>
            </div>
        </div>
    );
}

export default SettingsView;
