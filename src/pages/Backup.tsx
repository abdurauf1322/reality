import { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle,
  FileJson,
  Info
} from 'lucide-react';
import { backupService, type CRMBackup } from '../services/backupService';

const Backup = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  
  const [backupPreview, setBackupPreview] = useState<CRMBackup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // EXPORT LOGIC
  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      const blob = await backupService.exportBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `crm-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message || 'Backup yaratishda xatolik yuz berdi');
    } finally {
      setIsExporting(false);
    }
  };

  // IMPORT FILE READ LOGIC
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess(false);
    setBackupPreview(null);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const validBackup = await backupService.validateBackup(content);
        setBackupPreview(validBackup);
      } catch (err: any) {
        setImportError(err.message || "Backup faylini o'qishda xatolik.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // reset
        }
      }
    };
    reader.onerror = () => {
      setImportError("Faylni o'qish imkoni bo'lmadi.");
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // RESTORE LOGIC
  const handleRestore = async () => {
    if (!backupPreview) return;
    
    setIsImporting(true);
    setImportError('');
    try {
      await backupService.restoreBackup(backupPreview);
      setBackupPreview(null);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        window.location.reload(); // Reload to refresh all caches/states
      }, 2000);
    } catch (err: any) {
      setImportError(err.message || "Ma'lumotlarni tiklashda xatolik yuz berdi.");
      setIsImporting(false);
    }
  };

  const cancelRestore = () => {
    setBackupPreview(null);
    setImportError('');
  };

  return (
    <div className="flex flex-col h-full space-y-6 p-4 sm:p-6 overflow-y-auto">
      
      <div className="flex items-center gap-2">
        <Database className="text-blue-600 h-8 w-8" />
        <h1 className="text-2xl font-bold text-gray-900">Backup (Nusxa)</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* EXPORT SECTION */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Download className="text-gray-600 h-5 w-5" />
            <h2 className="font-bold text-gray-900">Export (Backup yaratish)</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Joriy qurilmadagi barcha CRM ma'lumotlarini (sotuvlar, mahsulotlar, qarzlar, xarajatlar) JSON fayl ko'rinishida qurilmangizga yuklab oling.
              </p>
              <div className="bg-blue-50 p-3 rounded-md flex gap-2 items-start text-sm text-blue-800 mb-6">
                <Info className="h-5 w-5 shrink-0 text-blue-600" />
                <p>Ushbu fayl lokal hisoblanadi. Uni xavfsiz joyda (fleshka, Google Drive yoki maxfiy joyda) saqlashingiz tavsiya etiladi. Faylni begona shaxslarga bermang!</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {exportSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md flex items-center gap-2 border border-green-100">
                  <CheckCircle size={18} /> Backup muvaffaqiyatli yaratildi.
                </div>
              )}
              
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Backup tayyorlanmoqda...
                  </>
                ) : (
                  <>
                    <FileJson size={20} /> Backup yaratish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* IMPORT SECTION */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Upload className="text-gray-600 h-5 w-5" />
            <h2 className="font-bold text-gray-900">Import (Restore qilish)</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            
            {!backupPreview ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    Oldin yaratilgan JSON formatidagi backup faylini tanlang. Tizim avval uni xavfsizlik va butunlik tekshiruvidan o'tkazadi.
                  </p>
                  
                  {importError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2 border border-red-100">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5" /> 
                      <p>{importError}</p>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md flex items-center gap-2 border border-green-100">
                      <CheckCircle size={18} /> Backup muvaffaqiyatli tiklandi. Sahifa yangilanmoqda...
                    </div>
                  )}
                </div>

                <div>
                  <input 
                    type="file" 
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting || importSuccess}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-700 px-4 py-8 rounded-lg hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                        Backup tekshirilmoqda...
                      </>
                    ) : (
                      <>
                        <Upload size={20} /> JSON fayl tanlash
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // PREVIEW & CONFIRMATION
              <div className="flex flex-col h-full animate-fadeIn">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-2 items-center text-orange-800 font-bold mb-2">
                    <AlertTriangle size={20} /> Diqqat!
                  </div>
                  <p className="text-sm text-orange-900 mb-3">
                    Backupni tiklash natijasida ushbu qurilmadagi joriy CRM ma'lumotlari backupdagi ma'lumotlar bilan to'liq almashtiriladi.
                  </p>
                  <button 
                    onClick={handleExport}
                    className="text-sm font-medium text-blue-700 hover:underline flex items-center gap-1"
                  >
                    Joriy ma'lumotlarni avval backup qilib olish <Download size={14}/>
                  </button>
                </div>

                <div className="flex-1 bg-gray-50 border rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-gray-900 mb-3 border-b pb-2">Backup ma'lumotlari:</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Versiya:</div>
                    <div className="font-medium text-right">{backupPreview.schemaVersion}</div>
                    
                    <div className="text-gray-500">Yaratilgan sana:</div>
                    <div className="font-medium text-right">{new Date(backupPreview.exportedAt).toLocaleString('uz-UZ')}</div>

                    <div className="col-span-2 my-1 border-b"></div>

                    <div className="text-gray-600">Mahsulotlar:</div>
                    <div className="font-medium text-right">{backupPreview.data.products.length} ta</div>

                    <div className="text-gray-600">Sotuvlar:</div>
                    <div className="font-medium text-right">{backupPreview.data.sales.length} ta</div>

                    <div className="text-gray-600">Mijozlar:</div>
                    <div className="font-medium text-right">{backupPreview.data.customers.length} ta</div>

                    <div className="text-gray-600">Qarzlar:</div>
                    <div className="font-medium text-right">{backupPreview.data.debts.length} ta</div>

                    <div className="text-gray-600">Qarz to'lovlari:</div>
                    <div className="font-medium text-right">{backupPreview.data.debtPayments.length} ta</div>

                    <div className="text-gray-600">Xarajatlar:</div>
                    <div className="font-medium text-right">{backupPreview.data.expenses.length} ta</div>

                    <div className="text-gray-600">Xarajat kategoriyalari:</div>
                    <div className="font-medium text-right">{backupPreview.data.expenseCategories.length} ta</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelRestore}
                    disabled={isImporting}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleRestore}
                    disabled={isImporting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Tiklanmoqda...
                      </>
                    ) : (
                      'Backupni tiklash'
                    )}
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>

    </div>
  );
};

export default Backup;
