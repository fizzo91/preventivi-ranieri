// Clean up old localStorage data to prevent duplications
export const cleanOldLocalStorageData = () => {
  const keysToRemove = [
    'products',
    'clients', 
    'quotes',
    'companySettings',
    'migrationCompleted'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  });
};
