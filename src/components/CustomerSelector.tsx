import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { customerService } from '../services/customerService';
import type { Customer } from '../types';

interface CustomerSelectorProps {
  selectedCustomerId: string;
  onSelect: (customerId: string) => void;
  onAddNew: () => void;
  required?: boolean;
}

export const CustomerSelector = ({ selectedCustomerId, onSelect, onAddNew, required }: CustomerSelectorProps) => {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load selected customer if exists
    if (selectedCustomerId) {
      customerService.getCustomerById(selectedCustomerId).then(c => {
        if (c) {
          setSelectedCustomer(c);
          setQuery(c.name);
        }
      });
    } else {
      setSelectedCustomer(null);
      setQuery('');
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    // Search customers
    const fetchCustomers = async () => {
      if (!isOpen) return;
      if (!query.trim()) {
        const all = await customerService.getCustomers();
        setCustomers(all.slice(0, 10)); // Just show top 10 initially
      } else {
        const res = await customerService.searchCustomers(query);
        setCustomers(res.slice(0, 10));
      }
    };
    
    const debounce = setTimeout(fetchCustomers, 200);
    return () => clearTimeout(debounce);
  }, [query, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query if they didn't select someone
        if (selectedCustomer) {
          setQuery(selectedCustomer.name);
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCustomer]);

  const handleSelect = (c: Customer) => {
    setSelectedCustomer(c);
    setQuery(c.name);
    setIsOpen(false);
    onSelect(c.id);
  };

  const handleClear = () => {
    setSelectedCustomer(null);
    setQuery('');
    onSelect('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-gray-600 mb-1">
        Mijoz tanlash {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full pl-9 pr-10 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Mijoz ismi yoki tel..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (selectedCustomer) {
              setSelectedCustomer(null);
              onSelect('');
            }
          }}
          onClick={() => setIsOpen(true)}
        />
        {selectedCustomer && (
          <button 
            type="button" 
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {customers.length > 0 ? (
            <ul className="py-1">
              {customers.map(c => (
                <li 
                  key={c.id} 
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                  onClick={() => handleSelect(c)}
                >
                  <span className="font-medium text-sm">{c.name}</span>
                  {c.phone && <span className="text-xs text-gray-500">{c.phone}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-center text-sm text-gray-500">
              Mijoz topilmadi
            </div>
          )}
          
          <div className="border-t p-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAddNew();
              }}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
            >
              <UserPlus size={16} /> Yangi mijoz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
