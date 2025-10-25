import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export function useUserCredits() {
  const { user } = useAuth();
  const setCredits = useStore((state) => state.setCredits);

  useEffect(() => {
    if (!user) {
      setCredits(0);
      return;
    }

    const fetchCredits = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setCredits(data.credits);
      }
    };

    fetchCredits();

    const channel = supabase
      .channel('user-credits')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload: { new: { credits: number } }) => {
          setCredits(payload.new.credits);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, setCredits]);
}
