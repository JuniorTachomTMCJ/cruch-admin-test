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
} from "@shopify/polaris";
import { ImageMajor } from "@shopify/polaris-icons";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

export default function ClientDetail() {
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
  const [retrait, setRetrait] = useState({});
  const [isLoading, setIsLoading] = useState(true);

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
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetch(`https://staging.api.creuch.fr/api/emplacement`, {
        method: "POST",
        body: JSON.stringify({ id: handle }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          if (data.location.errors) {
            console.log(data.customer.errors);
            redirect.dispatch(Redirect.Action.APP, "/retraits");
          } else {
            setRetrait(data.location);
            setIsLoading(false);
          }
        })
        .catch((error) =>
          console.error(
            "Erreur de chargement des détails du point de retrait :",
            error
          )
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
        backAction={{ content: "Points de retrait CSE", url: "/retraits" }}
        title={`${retrait.name}`}
        subtitle={`${retrait.address1}, ${retrait.country_name}`}
        compactTitle
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
        <div>
          <Modal open={isLoading} loading small></Modal>
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
      </Page>
    </Frame>
  );
};