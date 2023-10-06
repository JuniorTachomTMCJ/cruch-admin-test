import {
  Page,
  Layout,
  TextContainer,
  Grid,
  Form,
  Button,
  TextField,
  LegacyCard,
  FormLayout,
  Modal,
  IndexTable,
  useIndexResourceState,
  Text,
  EmptySearchResult,
  Link,
  Thumbnail,
} from "@shopify/polaris";
import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedFetch, useAppQuery } from "../../hooks";
import { useAppBridge , TitleBar } from "@shopify/app-bridge-react";
import {Redirect} from '@shopify/app-bridge/actions';

export default function HomePage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const user = localStorage.getItem("user");
  if (!user) {
    redirect.dispatch(Redirect.Action.APP, "/");
    return null;
  }
  const user_data = JSON.parse(user);
  const user_cse = user_data.code_cse?.value;

  const [active, setActive] = useState(false);
  const [actives, setActives] = useState(false);

  const generateOpen = useCallback(() => setActive(!active), [active]);
  const importOpen = useCallback(() => setActives(!actives), [actives]);

  const [initial, setInitial] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [amount, setAmount] = useState("");
  const [errorMessages, setErrorMessages] = useState({});
  const [customers, setCustomers] = useState([]);

  const handleInitialChange = useCallback((value) => setInitial(value), []);
  const handleMinChange = useCallback((value) => setMin(value), []);
  const handleMaxChange = useCallback((value) => setMax(value), []);
  const handleAmountChange = useCallback((value) => setAmount(value), []);

  const fetch = useAuthenticatedFetch();
  const handleSubmit = useCallback(async () => {
      console.log("TEST", initial);
      const response = await fetch("/api/products");
      console.log(response);

      for (let i = min; i <= max; i++) {
          console.log(min);
          console.log(i);
      }
  }, []);

  // Generate JSX code for error message
  const renderErrorMessage = (name) => name === errorMessages.name && (<div color="critical" className="error">{errorMessages.message}</div>);
  
  useEffect(() => {
      const fetchData = async () => {
          await fetch("https://staging.api.creuch.fr/api/get_customers_by_cse", {
              method: "POST",
              body: JSON.stringify({ code_cse: JSON.parse(localStorage.getItem('user')).code_cse.value }),
              headers: { "Content-type": "application/json" },
          })
          .then((response) => response.json())
          .then((object) => {
              console.log("client", object);
              setCustomers(object);
          })
          .catch((err) => {
              console.log(err.message);
              setErrorMessages({ name: "customers", message: err.message });
          });
      };

      fetchData();
  }, []);

  const resourceName = {
    singular: "Abondement",
    plural: "Abondements",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
      useIndexResourceState(customers);
  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucun abondement trouvé"}
      description={
        "Essayez de modifier les filtres ou les termes de recherche"
      }
      withIllustration
    />
  );

  const rowMarkup = customers.map(
    ({ id, displayName, email, phone, metafields }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Link
            dataPrimaryLink
            //url={id}
            onClick={() => {
              console.log(`Clicked ${displayName}`);
              localStorage.setItem('customer', JSON.stringify({ id, displayName, email, phone, metafields }));
              //console.log(JSON.parse(localStorage.getItem('customer')))
              redirect.dispatch(Redirect.Action.APP,  '/clients/edit');
            }}
          >
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {metafields.edges[1].node.value}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>{displayName}</IndexTable.Cell>
        <IndexTable.Cell>{email}</IndexTable.Cell>
        <IndexTable.Cell>{phone}</IndexTable.Cell>
        <IndexTable.Cell>{metafields.edges[0].node.value}</IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const bulkActions = [
    {
      content: "Activer les employés",
      onAction: () => console.log("Todo: implement bulk add tags"),
    },
    {
      content: "Désactiver les employés",
      onAction: () => console.log("Todo: implement bulk remove tags"),
    },
    {
      content: "Supprimer les employés",
      onAction: () => console.log("Todo: implement bulk delete"),
    },
  ];
  
  const count = customers.length;

  return (
    <Page
      fullWidth
      backAction={{ content: "Home", url: "/" }}
      title="Abondements"
      subtitle="Gérez les abondements de votre CSE"
      compactTitle
      primaryAction={{
        content: "Ajouter un abondement",
        onAction: generateOpen,
      }}
      secondaryActions={[
        {
          content: (
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              <div style={{ marginRight: "10px" }}>
                <Text as="p" fontWeight="bold" alignment="end">
                  {user_data.cse_name?.value} <br />
                  {user_data.code_cse?.value}
                </Text>
              </div>
              <Thumbnail
                source={
                  user_data.image.value ? user_data.image.value : ImageMajor
                }
                alt={`${user_data.cse_name.value}, ${user_data.company.value}`}
                size="small"
              />
            </div>
          ),
          onAction: () => {
            redirect.dispatch(Redirect.Action.APP, "/profile");
          },
        },
        {
          content: "Importer des abondements",
          onAction: importOpen,
        },
      ]}
    >
      <Layout>
        {/*           <Layout.Section>
          <Grid gap="4" columns={3}>
            <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
              <LegacyCard title={`${count}`} sectioned>
                <p>Employés inscrits</p>
              </LegacyCard>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
              <LegacyCard title="Clients" sectioned>
                <p>Employés actifs</p>
              </LegacyCard>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
              <LegacyCard title="Nombres" sectioned>
                <p>Employés inactifs</p>
              </LegacyCard>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
              <LegacyCard title="Nombres" sectioned>
                <p>Abondements</p>
              </LegacyCard>
            </Grid.Cell>
          </Grid>
        </Layout.Section> */}

        {/* Generate */}
        <Layout.Section>
          <div>
            <Modal
              open={active}
              onClose={generateOpen}
              title="Ajouter un nouvel employés"
              // primaryAction={{
              //     content: 'Générer',
              //     onAction: GetDataOnForm,
              // }}
              // secondaryActions={[
              //     {
              //         content: 'Annuler',
              //         onAction: generateOpen,
              //     },
              // ]}
            >
              <Modal.Section>
                <TextContainer>
                  <Form onSubmit={handleSubmit}>
                    <FormLayout>
                      <FormLayout>
                        <Grid>
                          <Grid.Cell
                            columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                          >
                            <TextField
                              type="number"
                              label="Générer a partir de : EX:200"
                              onChange={handleMinChange}
                              autoComplete="off"
                              value={min}
                              required="on"
                            />
                          </Grid.Cell>
                          <Grid.Cell
                            columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                          >
                            <TextField
                              type="number"
                              label="à  EX:100"
                              onChange={handleMaxChange}
                              autoComplete="off"
                              value={max}
                            />
                          </Grid.Cell>
                        </Grid>

                        <Grid>
                          <Grid.Cell
                            columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                          >
                            <TextField
                              type="text"
                              label="Veuillez spécifier les initiales à ajouter au matricule. EX:CTL_"
                              onChange={handleInitialChange}
                              autoComplete="off"
                              value={initial}
                            />
                          </Grid.Cell>
                          <Grid.Cell
                            columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                          >
                            <TextField
                              type="number"
                              label="Veuillez spécifier le montant de l'abondement a insérer. En chiffres"
                              onChange={handleAmountChange}
                              autoComplete="off"
                              value={amount}
                            />
                          </Grid.Cell>
                        </Grid>

                        <Button submit>Générer</Button>
                      </FormLayout>
                    </FormLayout>
                  </Form>
                </TextContainer>
              </Modal.Section>
            </Modal>
          </div>
        </Layout.Section>

        {/* Import */}
        <Layout.Section>
          <div>
            <Modal
              open={actives}
              onClose={importOpen}
              title="Importer vos matricules Entrepise"
              primaryAction={{
                content: "Importer",
                onAction: importOpen,
              }}
              secondaryActions={[
                {
                  content: "Annuler",
                  onAction: importOpen,
                },
              ]}
            >
              <Modal.Section>
                <TextContainer>
                  <Form>
                    <FormLayout>
                      <FormLayout>
                        <TextField
                          label="Veuillez chosiir un fichier Excel"
                          type="file"
                          onChange={() => {}}
                          autoComplete="off"
                        />
                      </FormLayout>
                    </FormLayout>
                  </Form>
                </TextContainer>
              </Modal.Section>
            </Modal>
          </div>
        </Layout.Section>

        <Layout.Section>
          <LegacyCard>
            <IndexTable
              resourceName={resourceName}
              itemCount={customers.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              emptyState={emptyStateMarkup}
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Matricule" },
                { title: "Nom et Prénoms" },
                { title: "Email" },
                { title: "Numéro de Téléphone" },
                { title: "Code CSE" },
              ]}
              bulkActions={bulkActions}
              onNavigation
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
