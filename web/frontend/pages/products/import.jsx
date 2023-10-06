// @ts-nocheck
import {
    Box,
    Card,
    Layout,
    Link,
    List,
    Page,
    Text,
    Thumbnail,
    LegacyStack,
    DropZone,
    VerticalStack,
    Grid,
    Icon,
    Button,
    LegacyCard,
    FormLayout,
    Form,
    TextField
  } from "@shopify/polaris";
  
  import { EditMajor } from "@shopify/polaris-icons";
  import { useState, useEffect, useCallback } from "react";
  import {NoteMinor} from '@shopify/polaris-icons';
  
  
  export default function ImportproductsPage() {
  
    const [errorMessages, setErrorMessages] = useState({});
    const renderErrorMessage = (name) =>
    name === errorMessages.name && (
      <div color="critical" className="error">{errorMessages.message}</div>
    );
  
    const errors = {
      file: "Fichier invalide",
      password: "Mot de passe inccorect"
    };
  
    const [file, setFile] = useState('');
    const handleFileChange = useCallback((value) => setFile(value), []);
  
    const handleSubmit = useCallback(async () => {
      // @ts-ignore
      console.log("fichier", document.getElementById("import").files[0]);
      importPorducts(document.getElementById("import").files[0]);
  
  }, []);
  
  
      const importPorducts = async (file) => {
        //console.log("file", file)
        setErrorMessages({ name: "file", message: "Importation en cours ... Vous recevrez un mail a la fin du traitement." });
        var formdata = new FormData();
        formdata.append("uploaded_file", file);
  
        var requestOptions = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };
        fetch("https://staging.api.creuch.fr/api/import_products_with_excell", requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));
  /* 
        await fetch('https://staging.api.creuch.fr/api/import_products_with_excell', {
          method: 'POST',
          body: JSON.stringify({
            uploaded_file: file
          }),
          headers: {
            'Content-type': 'application/json',
          },
        })
        .then((response) => response.json())
        .then((object) => {
          console.log("user is here", object);
        })
        .catch((err) => {
          console.log(err.message);
        }); */
      };
  
  
    return (
      <Page fullWidth
      title="Importer des produits"
      subtitle="Importer vos produits via excel"
      compactTitle
      >
        <ui-title-bar title="Importer des protuits" />
        <Layout>
          <Layout.Section>
          <LegacyCard sectioned>
          <Card>
              <VerticalStack gap="3">
                <Text as="p" variant="bodyMd">
                  Pour importer les produits, veuillez telecharger votre fichier d'import
                  en utilisant ce modèle de fichier d' import.{" "}
                  <Link
                    url="https://cdn.shopify.com/s/files/1/0759/9344/8726/files/Test_product_import.xlsx?v=1695638128?attachment=1"
                    target="_blank"
                  >
                    Fichier d'import
                  </Link>
                  
                </Text>
              </VerticalStack>
  
  
                      <Form onSubmit={handleSubmit}>
                        <FormLayout>
                          <FormLayout>
                            <TextField
                                value={file}
                                onChange={handleFileChange}
                                id="import"
                                label="Veuillez insérer votre fichier"
                                // @ts-ignore
                                type="file"
                                autoComplete="email"
                                helpText={
                                  <span>
                                      Une fois votre fichier d' import soumis vous recevrez un email a la fin du traitement
                                      
                                  </span>
                                }
                              />
  
                            <Button submit>Importer</Button>
                            {renderErrorMessage("file")}
                          </FormLayout>
                        </FormLayout>
                      </Form>
  
  
            </Card>
          </LegacyCard>
 
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  function Code({ children }) {
    return (
      <Box
        as="span"
        padding="025"
        paddingInlineStart="1"
        paddingInlineEnd="1"
        background="bg-subdued"
        borderWidth="1"
        borderColor="border"
        borderRadius="1"
      >
        <code>{children}</code>
      </Box>
    );
  }
  