create policy "Users can delete their own documents"
on documents
for delete
using (
  auth.uid() = user_id
);
