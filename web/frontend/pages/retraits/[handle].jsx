import {
  Modal,
  Icon,
  Grid,
  Badge,
  Page,
  Text,
  Frame,
  Divider,
  Loading,
  Thumbnail,
  LegacyCard,
  VerticalStack,
  Button,
  Form,
  FormLayout,
  Select,
  TextContainer,
  Banner,
  List,
  Link,
  Toast,
} from "@shopify/polaris";
import { ImageMajor } from "@shopify/polaris-icons";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

export default function ClientDetail() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const { handle } = useParams();
  const [retrait, setRetrait] = useState({});
  const [retraits, setRetraits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [disableRetrait, setDisableRetrait] = useState(false);

  const [activeOne, setActiveOne] = useState(false);
  const [message, setMessage] = useState("");
  const toggleActiveOne = useCallback(
    () => setActiveOne((activeOne) => !activeOne),
    []
  );
  const toastMarkup1 = activeOne ? (
    <Toast content={message} onDismiss={toggleActiveOne} />
  ) : null;

  const disableRetraitModal = useCallback(
    () => setDisableRetrait(!disableRetrait),
    [disableRetrait]
  );

  const [selected, setSelected] = useState(null);

  const handleSelectChange = useCallback((value) => setSelected(value), []);

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

  const handleEnableRetrait = useCallback(async () => {
    setIsLoading(true);
    await fetch(`https://staging.api.creuch.fr/api/enable_emplacement`, {
      method: "POST",
      body: JSON.stringify({
        id: handle,
      }),
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setMessage("Point de retrait activé.");
        toggleActiveOne();
        fetchData();
      })
      .catch((error) => {
        console.error(error);
        setMessage("Erreur d'activation de point de retrait.");
        toggleActiveOne();
      });
  }, [handle]);

  const handleDisableRetrait = useCallback(async () => {
    setIsLoading(true);
    if (selected == null) {
      setMessage("Veuillez sélectionner un emplacement.");
      toggleActiveOne();
      return;
    }
    await fetch(`https://staging.api.creuch.fr/api/disable_emplacement`, {
      method: "POST",
      body: JSON.stringify({
        id: handle,
        destination_id: selected,
      }),
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setMessage("Point de retrait désactivé.");
        toggleActiveOne();
        fetchData();
      })
      .catch((error) => {
        console.error(error);
        setMessage("Erreur de désactivation de point de retrait.");
        toggleActiveOne();
      });
    disableRetraitModal();
  }, [handle, selected]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [emplacementResponse, emplacementsResponse] = await Promise.all([
        fetch(`https://staging.api.creuch.fr/api/emplacement`, {
          method: "POST",
          body: JSON.stringify({ id: handle }),
          headers: {
            "Content-type": "application/json",
          },
        }),
        fetch("https://staging.api.creuch.fr/api/emplacements", {
          method: "GET",
          headers: {
            "Content-type": "application/json",
          },
        }),
      ]);

      const emplacementData = await emplacementResponse.json();
      const emplacementsData = await emplacementsResponse.json();

      console.log("Emplacement", emplacementData);
      console.log("Emplacements", emplacementsData);

      setRetrait(emplacementData.location);
      setRetraits(
        emplacementsData.filter(
          (emplacement) =>
            emplacementData.location.id != emplacement.id.match(/\/(\d+)$/)[1]
        )
      );
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [handle]);

  return (
    <Frame>
      <Page
        fullWidth
        backAction={{ content: "Points de retrait CSE", url: "/retraits" }}
        title={`${retrait.name}`}
        subtitle={`${retrait.address1}, ${retrait.country_name}`}
        compactTitle
      >
        <div>
          <Modal open={isLoading} loading small></Modal>
          <style>
            {`
            .Polaris-Modal-CloseButton { 
              display: none;
            }
            .Polaris-Modal-Dialog__Modal.Polaris-Modal-Dialog--sizeSmall {
              max-width: 5rem;
            }
            .Polaris-HorizontalStack {
              --pc-horizontal-stack-gap-xs: var(--p-space-0) !important;
            }
          `}
          </style>
        </div>
        <div>
          <Modal
            open={disableRetrait}
            onClose={disableRetraitModal}
            title={`Désactiver "${retrait.name}" ?`}
            primaryAction={{
              content: "Désactiver",
              onAction: handleDisableRetrait,
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: disableRetraitModal,
              },
            ]}
          >
            <Modal.Section>
              <TextContainer>
                <Banner status="warning">
                  <VerticalStack gap="4">
                    <Text as="p">
                      Pour désactiver <strong>{retrait.name}</strong>, vous
                      devez sélectionner un emplacement pour lui succéder :
                    </Text>
                    <List type="bullet">
                      <List.Item>
                        <Link
                          url={`https://admin.shopify.com/store/creuch-shop/products/inventory?location_id=${retrait.id}`}
                        >
                          Inventaire stocké
                        </Link>{" "}
                        à cet emplacement
                      </List.Item>
                      <List.Item>
                        <Link
                          url={`https://admin.shopify.com/store/creuch-shop/orders?fulfillment_status=unfulfilled%2Cscheduled%2Con_hold&reference_location_id=${retrait.id}`}
                        >
                          Commandes non traitées
                        </Link>{" "}
                        attribué à cet emplacement
                      </List.Item>
                    </List>
                  </VerticalStack>
                </Banner>
              </TextContainer>
            </Modal.Section>
            <Modal.Section>
              <Form>
                <FormLayout>
                  <Grid>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <Select
                        label="Entreposer les stocks à :"
                        options={[
                          {
                            label: "Veullez sélectionner un emplacement...",
                            value: "null",
                          },
                          ...retraits.map((retrait) => ({
                            label: retrait.name,
                            value: retrait.id.match(/\/(\d+)$/)[1],
                          })),
                        ]}
                        onChange={handleSelectChange}
                        value={selected}
                        required
                      />
                    </Grid.Cell>
                  </Grid>
                </FormLayout>
              </Form>
            </Modal.Section>
          </Modal>
        </div>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}>
            <LegacyCard>
              <LegacyCard.Section>
                <VerticalStack gap="3">
                  <Text as="h1">Nom : {retrait.name}</Text>
                  <Divider borderColor="border" />
                  <Text as="h1">Adresse : {retrait.address1}</Text>
                  <Divider borderColor="border" />
                  <Text as="h1">Ville : {retrait.city}</Text>
                  <Divider borderColor="border" />
                  <Text as="h1">Pays : {retrait.country_name}</Text>
                  <Divider borderColor="border" />
                  <Text as="h1">Téléphone : {retrait.phone}</Text>
                  <Divider borderColor="border" />
                  <Text as="h1">Code Postal : {retrait.zip}</Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Statut :{" "}
                    {retrait.active === true ? (
                      <Badge status="success">Actif</Badge>
                    ) : (
                      <Badge status="critical">Inactif</Badge>
                    )}
                  </Text>
                </VerticalStack>
              </LegacyCard.Section>
            </LegacyCard>
          </Grid.Cell>
        </Grid>
        <br />
        <Grid>
          <Grid.Cell
            columnSpan={{ xs: 6, sm: 6, md: 5, lg: 10, xl: 10 }}
          ></Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 1, lg: 2, xl: 2 }}>
            {retrait.active === true ? (
              <button
                className="Polaris-Button Polaris-Button--sizeSlim"
                type="button"
                style={{
                  backgroundColor: "#e51c00",
                  color: "white",
                }}
                onClick={disableRetraitModal}
              >
                <span className="Polaris-Button__Content">
                  <span className="Polaris-Button__Text">
                    Désactiver le point de retrait
                  </span>
                </span>
              </button>
            ) : (
              <Button primary onClick={handleEnableRetrait}>
                Activer le point de retrait
              </Button>
            )}
          </Grid.Cell>
        </Grid>
        {toastMarkup1}
      </Page>
    </Frame>
  );
}
