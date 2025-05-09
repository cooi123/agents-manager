export const handleDownload = async (path: string, filename: string) => {
    try {
      const { data, error } = await window.supabase.storage
        .from('documents')
        .download(path);
      
      if (error) {
        throw error;
      }
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };