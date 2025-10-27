// add this import near the top with the others
import { API_URL } from '../lib/config';

// ...

const handleGenerateStatic = async (variantId: string, conceptTag: string) => {
  setGeneratingStatic(prev => new Set(prev).add(variantId));
  addToast('info', `Generating images for Concept ${conceptTag}...`);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // 🔧 absolute API URL (was: '/api/render/static')
    const response = await fetch(`${API_URL}/api/render/static`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, userId: user?.id }),
    });

    const data = await response.json();

    if (response.status === 402) {
      setCreditError({ needed: data.needed, current: data.current });
      setShowCreditDialog(true);
      addToast('error', 'Insufficient credits to generate images');
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate images');
    }

    if (data.success && data.imageUrls) {
      const updatedVariants = variants.map(v =>
        v.id === variantId ? { ...v, staticImages: data.imageUrls } : v
      );
      setVariants(updatedVariants);
      addToast('success', `Ready – ${data.count} images created for Concept ${conceptTag}`);
    }
  } catch (error) {
    console.error('Error generating static images:', error);
    addToast('error', error instanceof Error ? error.message : 'Failed to generate static images');
  } finally {
    setGeneratingStatic(prev => {
      const newSet = new Set(prev);
      newSet.delete(variantId);
      return newSet;
    });
  }
};
