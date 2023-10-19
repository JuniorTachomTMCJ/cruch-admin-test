import {
  Modal,
  Icon,
  Grid,
  Badge,
  Page,
  Text,
  Link,
  Toast,
  Form,
  FormLayout,
  TextField,
  Button,
  Frame,
  Divider,
  Loading,
  LegacyCard,
  VerticalStack,
} from "@shopify/polaris";
import { EditMajor } from "@shopify/polaris-icons";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

export default function AbondementPage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const user = localStorage.getItem("user");
  if (!user) {
    redirect.dispatch(Redirect.Action.APP, "/");
    return null;
  }
  const user_data = JSON.parse(user);
  const user_cse = user_data.code_cse?.value;

  const { handle } = useParams();
  const [abondement, setAbondement] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [activeOne, setActiveOne] = useState(false);
  const [message, setMessage] = useState("");
  const toggleActiveOne = useCallback(() => setActiveOne((activeOne) => !activeOne), []);

  const toastMarkup1 = activeOne ? (
    <Toast content={message} onDismiss={toggleActiveOne} />
  ) : null;

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
      timeZone: "UTC",
    };
    return dateTimeString
      ? new Intl.DateTimeFormat("fr-FR", options).format(inputDate)
      : "";
  }

  const handleChangeStateAbondement = useCallback(async () => {
    // await fetch(`https://staging.api.creuch.fr/api/changestatecustomerbyid`, {
    //   method: "POST",
    //   body: JSON.stringify({
    //     id: handle,
    //     state: state == "enabled" ? "disabled" : "enabled",
    //   }),
    //   headers: { "Content-type": "application/json" },
    // })
    //   .then((response) => response.json())
    //   .then((data) => {
    //     if (data.errors) {
    //       setMessage(data.errors.toString());
    //     } else {
    //       setMessage(
    //         data.customer.state == "enabled"
    //           ? "Compte activé avec succès !"
    //           : "Compte désactivé avec succès !"
    //       );
    //     }
    //     fetchData();
    //   })
    //   .catch((error) => {
    //     console.error("Erreur de modification de l'adresse du client :", error);
    //     setMessage("Erreur de modification de l'adresse du client.");
    //   });
    // toggleActiveOne();
  }, [handle]);
  
  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      await fetch(`https://staging.api.creuch.fr/api/get_gift_card`, {
        method: "POST",
        body: JSON.stringify({
          id: handle,
        }),
        headers: {
          "Content-type": "application/json"
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setAbondement(data);
          setIsLoading(false);
        })
        .catch((error) =>
          console.error("Erreur de chargement des détails de l'abondement :", error)
        );
    };

    fetchData();
  }, [handle]);

  // if (isLoading) {
  //   return (
  //     <div style={{ height: "100px" }}>
  //       <Frame>
  //         <Loading />
  //       </Frame>
  //     </div>
  //   );
  // }

  return (
    <Frame>
      <Page
        fullWidth
        backAction={{ content: "Abondements CSE", url: "/abondements" }}
        title={`${abondement.note}`}
        subtitle={`Émise par une application tierce le ${formatDateTime(
          abondement.created_at
        )}`}
        compactTitle
        actionGroups={[
          {
            title: "Autres actions",
            actions: [
              {
                content:
                  abondement.disabled_at == null
                    ? "Désactiver l'abondement"
                    : "",
                onAction: () => handleChangeStateAbondement(),
              },
            ],
          },
        ]}
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
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}>
            <LegacyCard>
              <LegacyCard.Section>
                <VerticalStack gap="3">
                  <Text as="h1">Code : {abondement.note}</Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Date de création : {formatDateTime(abondement.created_at)}
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Salarié :{" "}
                    <Link
                      dataPrimaryLink
                      url={`/salaries/${
                        abondement.customer?.id.match(/\/(\d+)$/)[1]
                      }`}
                    >
                      {abondement.customer?.firstName}{" "}
                      {abondement.customer?.lastName}
                    </Link>
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Réduction : {abondement.initial_value} {abondement.currency}
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Disponible : {abondement.balance} {abondement.currency}
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Utilisé : {abondement.initial_value - abondement.balance}{" "}
                    {abondement.currency}
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Expiration : {formatDateTime(abondement.expires_on)}
                  </Text>
                </VerticalStack>
              </LegacyCard.Section>
            </LegacyCard>
          </Grid.Cell>
        </Grid>
        {toastMarkup1}
      </Page>
    </Frame>
  );
};
