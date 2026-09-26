import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Database, 
  Info,
  LockKeyhole
} from 'lucide-react';
import { securityService } from '../services/securityService';

const Settings = () => {
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // Set Password Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  // Disable Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await securityService.isPasswordEnabled();
      setPasswordEnabled(enabled);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      return setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Parollar mos kelmadi.');
    }

    setIsSubmitting(true);
    try {
      await securityService.setPassword(newPassword);
      setSuccess("Parol muvaffaqiyatli o'rnatildi.");
      setPasswordEnabled(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      return setError('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Yangi parollar mos kelmadi.');
    }

    setIsSubmitting(true);
    try {
      const isValid = await securityService.verifyPassword(oldPassword);
      if (!isValid) {
        setIsSubmitting(false);
        return setError('Eski parol noto\'g\'ri.');
      }
      
      await securityService.setPassword(newPassword);
      setSuccess("Parol muvaffaqiyatli o'zgartirildi.");
      setIsChanging(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisablePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setIsSubmitting(true);
    try {
      const isValid = await securityService.verifyPassword(currentPassword);
      if (!isValid) {
        setIsSubmitting(false);
        return setError('Parol noto\'g\'ri.');
      }
      
      await securityService.disablePassword();
      setSuccess("Password protection o'chirildi.");
      setPasswordEnabled(false);
      setIsDisabling(false);
      setCurrentPassword('');
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockNow = () => {
    // Dispatch custom event to lock screen
    window.dispatchEvent(new Event('manual-lock'));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-4 sm:p-6 overflow-y-auto">
      
      <div className="flex items-center gap-2">
        <SettingsIcon className="text-blue-600 h-8 w-8" />
        <h1 className="text-2xl font-bold text-gray-900">Sozlamalar</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button 
          onClick={() => { setActiveTab('general'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Umumiy
        </button>
        <button 
          onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          {passwordEnabled ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />} Xavfsizlik
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="text-gray-500" /> Tizim haqida
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <p className="text-gray-500">Ilova versiyasi:</p>
                <p className="font-medium text-gray-900">1.0.0 (Phase 10 Release)</p>
              </div>
              <div>
                <p className="text-gray-500">Ishlash rejimi:</p>
                <p className="font-medium text-green-600 flex items-center gap-1">Local-First / Offline-First</p>
              </div>
              <div>
                <p className="text-gray-500">Ma'lumotlar bazasi:</p>
                <p className="font-medium text-gray-900">IndexedDB (Dexie)</p>
              </div>
              <div>
                <p className="text-gray-500">Backend server:</p>
                <p className="font-medium text-gray-900">Mavjud emas (No Cloud)</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm leading-relaxed border border-blue-100">
              Ushbu CRM butunlay oflayn tarzda faqatgina sizning joriy qurilmangizda ishlaydi. Ma'lumotlaringiz hech qanday tashqi serverga yuborilmaydi.
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="text-gray-500" /> Ma'lumotlarni boshqarish
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              CRM ma'lumotlar bazasini JSON formatida eksport qilib xavfsiz joyda saqlashingiz yoki oldingi backupni tiklashingiz mumkin.
            </p>
            <Link to="/backup" className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
              Backup sahifasiga o'tish
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="text-gray-500" /> Parol bilan himoya
                </h2>
                <p className="text-sm text-gray-500 mt-1">CRM dasturiga kirishni parol orqali cheklash</p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${passwordEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {passwordEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-100">
                {success}
              </div>
            )}

            {!passwordEnabled ? (
              // SET PASSWORD
              <form onSubmit={handleSetPassword} className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol (min 6ta belgi)</label>
                  <input 
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parolni tasdiqlash</label>
                  <input 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  Parol o'rnatish
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                
                {/* ACTION BUTTONS */}
                {!isChanging && !isDisabling && (
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => { setIsChanging(true); setIsDisabling(false); setError(''); setSuccess(''); }}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Parolni o'zgartirish
                    </button>
                    <button 
                      onClick={() => { setIsDisabling(true); setIsChanging(false); setError(''); setSuccess(''); }}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-medium border border-red-100"
                    >
                      Himoyani o'chirish
                    </button>
                    <button 
                      onClick={handleLockNow}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <LockKeyhole size={16} /> Qulflash (Lock now)
                    </button>
                  </div>
                )}

                {/* CHANGE PASSWORD FORM */}
                {isChanging && (
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm border p-4 rounded-md bg-gray-50">
                    <h3 className="font-bold text-gray-900 mb-2">Parolni o'zgartirish</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eski parol</label>
                      <input 
                        type="password"
                        required
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol</label>
                      <input 
                        type="password"
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parolni tasdiqlash</label>
                      <input 
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                      >
                        Saqlash
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setIsChanging(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                        className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium text-sm"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </form>
                )}

                {/* DISABLE PASSWORD FORM */}
                {isDisabling && (
                  <form onSubmit={handleDisablePassword} className="space-y-4 max-w-sm border p-4 rounded-md bg-red-50 border-red-100">
                    <h3 className="font-bold text-red-800 mb-2">Himoyani o'chirish</h3>
                    <div>
                      <label className="block text-sm font-medium text-red-900 mb-1">Joriy parolni kiriting</label>
                      <input 
                        type="password"
                        required
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
                      >
                        O'chirish
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setIsDisabling(false); setCurrentPassword(''); }}
                        className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium text-sm"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </form>
                )}

              </div>
            )}
            
            <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm leading-relaxed border border-yellow-200">
              <strong className="block mb-1">Muhim eslatma:</strong>
              Bu parol faqatgina ushbu qurilmadagi CRM interfeysini qulflash uchun ishlatiladi. CRM oflayn ishlaydi va parolni tiklash (recovery) imkoniyati mavjud emas. Agar parolingizni unutsangiz dasturga kira olmaysiz.
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
