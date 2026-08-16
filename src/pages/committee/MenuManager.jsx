import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2 } from 'lucide-react';
import AnimatedPage from '../../components/AnimatedPage';
import { BrutalCard, BrutalButton } from '../../components/ui';
import { saveTodayMenu, listenTodayMenu } from '../../lib/firestoreService';
import { format } from 'date-fns';

/* ─────────────────────────────────────────────────────────
   Committee — Menu Manager (Phase 2: live Firestore)
───────────────────────────────────────────────────────── */

const DEFAULT_MENU = {
  breakfast: { timing: '8:00 – 9:30 AM',  items: [] },
  lunch:     { timing: '1:00 – 2:30 PM',  items: [] },
  dinner:    { timing: '8:00 – 9:30 PM',  items: [] },
};
const MEAL_COLORS = {
  breakfast: 'bg-brand-primary',
  lunch:     'bg-brand-secondary',
  dinner:    'bg-brand-accent',
};
const MEAL_EMOJIS = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' };

function MealEditor({ meal, data, onChange }) {
  const [newItem, setNewItem] = useState('');
  const addItem = () => {
    if (!newItem.trim()) return;
    onChange({ ...data, items: [...(data.items || []), newItem.trim()] });
    setNewItem('');
  };
  const removeItem = (idx) =>
    onChange({ ...data, items: data.items.filter((_, i) => i !== idx) });

  return (
    <BrutalCard color={MEAL_COLORS[meal]} className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{MEAL_EMOJIS[meal]}</span>
        <h3 className="font-serif font-bold text-lg capitalize">{meal}</h3>
        <span className="font-sans text-xs text-brand-light ml-auto">{data.timing}</span>
      </div>

      {/* Items list */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(data.items || []).map((item, idx) => (
          <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-white/60 border border-brand-dark/20 rounded-pill font-sans text-xs font-medium">
            {item}
            <button onClick={() => removeItem(idx)} className="text-brand-dark/50 hover:text-red-600 ml-1">
              <Trash2 size={10} />
            </button>
          </span>
        ))}
        {data.items?.length === 0 && (
          <span className="font-sans text-xs text-brand-light italic">No items — add below</span>
        )}
      </div>

      {/* Add item input */}
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
          placeholder="Add dish (press Enter)"
          className="flex-1 border-2 border-brand-dark rounded-brutal px-3 py-2 font-sans text-sm bg-white/80 outline-none"
        />
        <button onClick={addItem} className="w-10 h-10 bg-brand-dark text-brand-bg rounded-brutal border-2 border-brand-dark flex items-center justify-center">
          <Plus size={16} />
        </button>
      </div>
    </BrutalCard>
  );
}

export default function MenuManager() {
  const today = format(new Date(), 'EEEE, dd MMM yyyy');
  const [menu, setMenu]         = useState(DEFAULT_MENU);
  const [saving, setSaving]     = useState(false);
  const [saved,  setSaved]      = useState(false);

  useEffect(() => {
    const unsub = listenTodayMenu((data) => {
      if (!data) return;
      setMenu({
        breakfast: data.breakfast || DEFAULT_MENU.breakfast,
        lunch:     data.lunch     || DEFAULT_MENU.lunch,
        dinner:    data.dinner    || DEFAULT_MENU.dinner,
      });
    });
    return () => unsub?.();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTodayMenu(menu);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateMeal = (meal, data) => setMenu(m => ({ ...m, [meal]: data }));

  return (
    <AnimatedPage direction={1} className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-serif font-bold text-3xl">Menu <span className="highlight">Manager</span></h2>
          <p className="font-sans text-sm text-brand-light mt-1">{today} — changes go live instantly</p>
        </div>
        <BrutalButton
          icon={Save} onClick={handleSave} disabled={saving}
          variant={saved ? 'success' : 'primary'}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Menu'}
        </BrutalButton>
      </div>

      <div className="flex flex-col gap-5 max-w-2xl">
        {['breakfast', 'lunch', 'dinner'].map(meal => (
          <motion.div key={meal} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <MealEditor meal={meal} data={menu[meal]} onChange={d => updateMeal(meal, d)} />
          </motion.div>
        ))}
      </div>
    </AnimatedPage>
  );
}
