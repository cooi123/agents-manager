CREATE POLICY "Only user part of project can view transactions"
ON transactions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = transactions.project_id
        AND projects.user_id = auth.uid()
    )
);


