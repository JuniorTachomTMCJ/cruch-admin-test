import {Page, Form, FormLayout, Layout, Checkbox, TextField, Button} from '@shopify/polaris';
import {useState, useCallback} from 'react';
import { TitleBar } from "@shopify/app-bridge-react";



export default function GenerateMatricules() {
  const [newsletter, setNewsletter] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = useCallback(() => {
    setEmail('');
    setNewsletter(false);
  }, []);

  const handleNewsLetterChange = useCallback(
    (value) => setNewsletter(value),
    [],
  );

  const handleEmailChange = useCallback((value) => setEmail(value), []);

  return (
    <Page fullWidth>
      <TitleBar title={t("Générer des matricules")} primaryAction={null} />
      <Layout>
          <Layout.Section>
            <Form onSubmit={handleSubmit}>
              <FormLayout>

            
              </FormLayout>
            </Form>
          </Layout.Section>
      </Layout>
    </Page>

  );
}