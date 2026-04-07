async function triggerSeed() {
  try {
    const res = await fetch('http://localhost:3000/api/studio/events/seed', {
      method: 'POST'
    });
    const data = await res.json();
    console.log('Seed response:', data);
  } catch (err) {
    console.error('Seed error:', err);
  }
}

triggerSeed();
