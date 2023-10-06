import {
  Page,
  Layout,
  TextContainer,
  Grid,
  Icon,
  Form,
  Button,
  TextField,
  Divider,
  LegacyCard,
  FormLayout,
  Thumbnail,
  Modal,
  VerticalStack,
  IndexTable,
  useIndexResourceState,
  Text,
  EmptySearchResult,
  Link,
} from "@shopify/polaris";
import { EditMajor, ImageMajor } from "@shopify/polaris-icons";
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

  const [profile, setProfile] = useState(user_data);

  console.log("user", profile)

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

  function formatDateTime(dateTimeString) {
    const inputDate = new Date(dateTimeString);
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC", // Assuming input time is in UTC
    };
    return new Intl.DateTimeFormat("en-US", options).format(inputDate);
  }

  // Generate JSX code for error message
  const renderErrorMessage = (name) => name === errorMessages.name && (<div color="critical" className="error">{errorMessages.message}</div>);
  
  useEffect(() => {
      const fetchData = async () => {
          await fetch("https://staging.api.creuch.fr/api/check_entreprise", {
              method: "POST",
              body: JSON.stringify({ code_cse: JSON.parse(localStorage.getItem('user')).code_cse.value }),
              headers: { "Content-type": "application/json" },
          })
          .then((response) => response.json())
          .then((object) => {
              console.log("Profil 1", object.data.metaobjects.edges[0].node);
              setProfile(object.data.metaobjects.edges[0].node);
              console.log("Profil 2", profile);
          })
          .catch((err) => {
              console.log(err.message);
              setErrorMessages({ name: "customers", message: err.message });
          });
      };

      fetchData();
  }, []);

  const resourceName = {
    singular: "Employé CSE",
    plural: "Employés CSE",
  };

  /*    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(customers);
     */
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucun employés trouvés"}
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
          <Link dataPrimaryLink url={`/clients/${id.match(/\/(\d+)$/)[1]}`} >
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
      backAction={{ content: "Accueil", url: "/" }}
      title="Profil"
      subtitle="Informations de votre CSE"
      compactTitle
      /* primaryAction={{
        content: "Modifier le profil",
        onAction: generateOpen,
      }} */
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
      ]}
    >
      <Layout>
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <LegacyCard
                title={`${profile.cse_name.value} ${profile.cse_name.value}`}
                actions={[
                  {
                    content: `${profile.email.value}`,
                    url: `mailto:${profile.email.value}`,
                  },
                  /*                     {
                    content: <Icon source={EditMajor} color="base" />,
                    onAction: () => openEditCustomerModal(),
                  }, */
                ]}
              >
                <LegacyCard.Section>
                  <VerticalStack gap="3">
                    <Divider borderColor="border" />
                    <Text as="h1">Nom : {profile.cse_name.value}</Text>
                    <Divider borderColor="border" />
                    <Text as="h1">Mail : {profile.email.value}</Text>
                    <Divider borderColor="border" />
                    <Text as="h1">Code CSE : {profile.displayName}</Text>

                    <Divider borderColor="border" />
                    <Text as="h1">Adresse : {profile.address.value}</Text>

                    <Divider borderColor="border" />
                    <Text as="h1">Téléphone : {profile.phone.value}</Text>

                    <Divider borderColor="border" />
                    <Text as="h1">Province : {profile.province.value}</Text>

                    <Divider borderColor="border" />
                    <Text as="h1">
                      Date d'inscription :{" "}
                      {formatDateTime(profile.date_add.value)}
                    </Text>
                    <Divider borderColor="border" />
                    <Text as="h1">
                      Dernière mise à Jour :{" "}
                      {formatDateTime(profile.date_upd.value)}
                    </Text>
                  </VerticalStack>
                </LegacyCard.Section>
              </LegacyCard>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <LegacyCard title="Image de profil">
                <LegacyCard.Section>
                  <Thumbnail
                    source={profile.image.value ? profile.image.value : ImageMajor}
                    size="large"
                    alt={profile.cse_name.value}
                  />
                </LegacyCard.Section>
              </LegacyCard>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

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
      </Layout>
    </Page>
  );
}
