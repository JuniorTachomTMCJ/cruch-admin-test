import {
  Box,
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
  Select,
  Layout,
  TextContainer,
  Divider,
  Loading,
  LegacyCard,
  IndexTable,
  VerticalStack,
  HorizontalGrid,
  EmptySearchResult,
  useIndexResourceState,
  Thumbnail,
} from "@shopify/polaris";
import { EditMajor, ImageMajor } from "@shopify/polaris-icons";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import countriesList from "countries-list";

export default function ClientDetail() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  
  const { handle } = useParams();
  const [client, setClient] = useState({});
  const [metafields, setMetafields] = useState([]);
  const [entreprise, setEntreprise] = useState(null);
  const [adresses, setAdresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [abondements, setAbondements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");

  const handleFirstnameChange = useCallback((value) => setFirstname(value), []);
  const handleLastnameChange = useCallback((value) => setLastname(value), []);
  const handleEmailChange = useCallback((value) => setEmail(value), []);
  const handlePasswordChange = useCallback((value) => setPassword(value), []);
  const handleStateChange = useCallback((value) => setState(value), []);

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editCustomer, setEditCustomer] = useState(false);
  const [modalAdresse, setModalAdresse] = useState(false);
  const [modalOrder, setModalOrder] = useState(false);
  const [alert, setAlert] = useState(false);
  const [activeOne, setActiveOne] = useState(false);
  const [message, setMessage] = useState("");
  const [currentAddress, setCurrentAddress] = useState({
    id: "",
    first_name: "",
    last_name: "",
    address1: "",
    address2: "",
    city: "",
    country_code: "",
    zip: "",
    phone: "",
    company: "",
    default: false,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleFieldChange = useCallback((fieldName, value) => {
    setCurrentAddress((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, []);

  const initializeAddressForm = () => {
    setCurrentAddress({
      first_name: "",
      last_name: "",
      address1: "",
      address2: "",
      city: "",
      country_code: "",
      zip: "",
      phone: "",
      company: "",
      default: false,
    });
    setIsEditingAddress(false);
  };

  const initializeEditAddressForm = (address) => {
    setCurrentAddress({ ...address });
    setIsEditingAddress(true);
  };

  const openEditCustomerModal = useCallback(
    () => setEditCustomer(!editCustomer),
    [editCustomer]
  );

  const openAddressModal = useCallback(
    () => setModalAdresse(!modalAdresse),
    [modalAdresse]
  );

  const handleOpenOrderDetails = (orderDetails) => {
    setSelectedOrder(orderDetails);
    openOrderModal();
  };

  const openOrderModal = useCallback(
    () => setModalOrder(!modalOrder),
    [modalOrder]
  );

  const handleAddressFormSubmit = useCallback(async () => {
    if (isEditingAddress) {
      await fetch(`https://staging.api.creuch.fr/api/editcustomeraddressbyid`, {
        method: "POST",
        body: JSON.stringify({
          customer_id: currentAddress.customer_id,
          address_id: currentAddress.id,
          zip: currentAddress.zip,
          country_code: currentAddress.country_code,
          city: currentAddress.city,
          address1: currentAddress.address1,
          address2: currentAddress.address2,
          first_name: currentAddress.first_name,
          last_name: currentAddress.last_name,
          company: currentAddress.company,
          phone: currentAddress.phone,
          default: currentAddress.default,
        }),
        headers: { "Content-type": "application/json" },
      })
        .then((response) => response.json())
        .then(() => {
          setMessage("Modification effectué avec succès.");
          fetchData();
        })
        .catch((error) => {
          console.error("Erreur de modification de l'adresse du client :", error);
          setMessage("Erreur de modification de l'adresse du client.");
        });
    } else {
      await fetch(`https://staging.api.creuch.fr/api/createcustomeraddress`, {
        method: "POST",
        body: JSON.stringify({
          customer_id: handle,
          zip: currentAddress.zip,
          country_code: currentAddress.country_code,
          city: currentAddress.city,
          address1: currentAddress.address1,
          address2: currentAddress.address2,
          first_name: currentAddress.first_name,
          last_name: currentAddress.last_name,
          company: currentAddress.company,
          phone: currentAddress.phone,
          default: currentAddress.default,
        }),
        headers: { "Content-type": "application/json" },
      })
        .then((response) => response.json())
        .then(() => {
          setMessage("Ajout d'adresse effectué avec succès.");
          fetchData();
          initializeAddressForm();
        })
        .catch((error) => {
          console.error("Erreur d'ajout de l'adresse du client :", error);
          setMessage("Erreur d'ajout de l'adresse du client.");
        });
    }
    toggleActiveOne();
    openAddressModal();
  }, [currentAddress, isEditingAddress, handle]);

  const handleEditCustomer = useCallback(async () => {
    let params = password
      ? {
          id: handle,
          first_name: firstname,
          last_name: lastname,
          email: email,
          state: state,
          password: password
        }
      : {
          id: handle,
          first_name: firstname,
          last_name: lastname,
          email: email,
          state: state
        };
    await fetch(`https://staging.api.creuch.fr/api/editcustomerbyid`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Content-type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.errors) {
          console.log(data.errors);
          setMessage("Error :" + data.errors.toString());
        } else {
          setMessage("Modification effectué avec succès.");
        }
        fetchData();
        openEditCustomerModal();
      })
      .catch((error) => {
        console.error("Erreur de modification de l'adresse du client :", error);
        setMessage("Erreur de modification de l'adresse du client.");
      });
    
    toggleActiveOne();
  }, [handle, firstname, lastname, email, password, state]);
  
  const handleDeleteCustomer = useCallback(async () => {
    await fetch(`https://staging.api.creuch.fr/api/deletecustomerbyid`, {
      method: "POST",
      body: JSON.stringify({
        id: handle,
      }),
      headers: { "Content-type": "application/json" },
    })
      .then((response) => response.json())
      .then(() => {
        redirect.dispatch(Redirect.Action.APP, "/clients");
      })
      .catch((error) => {
        console.error("Erreur de suppression du client :", error);
        setMessage("Erreur de suppression du client.");
        toggleActiveOne();
      });
  }, [handle]);

  const handleChangeStateCustomer = useCallback(async () => {
    await fetch(`https://staging.api.creuch.fr/api/changestatecustomerbyid`, {
      method: "POST",
      body: JSON.stringify({
        id: handle,
        state: state == "enabled" ? "disabled" : "enabled",
      }),
      headers: { "Content-type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.errors) {
          setMessage(data.errors.toString());
        } else {
          setMessage(
            data.customer.state == "enabled"
              ? "Compte activé avec succès !"
              : "Compte désactivé avec succès !"
          );
        }
        fetchData();
      })
      .catch((error) => {
        console.error("Erreur de modification de l'adresse du client :", error);
        setMessage("Erreur de modification de l'adresse du client.");
      });
    toggleActiveOne();
  }, [handle, state]);

  const toggleActiveOne = useCallback(() => setActiveOne((activeOne) => !activeOne), []);
  const handleAlert = useCallback(() => setAlert(!alert), [alert]);

  const toastMarkup1 = activeOne ? (
    <Toast content={message} onDismiss={toggleActiveOne} />
  ) : null;

  const countries = Object.entries(countriesList.countries).map(
    ([code, countryInfo]) => ({
      value: code,
      label: countryInfo.name,
    })
  );

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
  
  const fetchData = async () => {
    setIsLoading(true);
    await fetch(`https://staging.api.creuch.fr/api/getcustomerbyid`, {
      method: "POST",
      body: JSON.stringify({
        id: handle,
      }),
      headers: { "Content-type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.customer.errors) {
          console.log(data.customer.errors);
          redirect.dispatch(Redirect.Action.APP, "/clients");
        } else {
          console.log(data);
          let customer = data.customer.customer,
            entreprise = data.enterprise.original.data.metaobjects.edges[0].node,
            orders = data.orders.orders,
            metafields = data.meta.metafields,
            abondements = data.abondements,
            adresses = customer.addresses;
          setClient(customer);
          setAdresses(adresses);
          setMetafields(metafields);
          setEntreprise(entreprise);
          setOrders(orders);
          setAbondements(abondements);

          setFirstname(customer.first_name);
          setLastname(customer.last_name);
          setEmail(customer.email);
          setState(customer.state);
          setIsLoading(false);
        }
      })
      .catch((error) =>
        console.error("Erreur de chargement des détails du client :", error)
      );
  };

  useEffect(() => {
    fetchData();
  }, [handle]);

  const resourceName = {
    singular: "Adresse",
    plural: "Adresses"
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(adresses);
  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucun adresse"}
      description={"Ajouter une adresse à ce client"}
      withIllustration
    />
  );

  const rowMarkup = adresses.map(
    (
      { id, company, name, address1, country, phone, default: isDefault },
      index
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>{id}</IndexTable.Cell>
        <IndexTable.Cell>{company}</IndexTable.Cell>
        <IndexTable.Cell>{name}</IndexTable.Cell>
        <IndexTable.Cell>{address1}</IndexTable.Cell>
        <IndexTable.Cell>{country}</IndexTable.Cell>
        <IndexTable.Cell>{phone}</IndexTable.Cell>
        <IndexTable.Cell>
          {isDefault ? <Badge status="success">Oui</Badge> : null}
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const bulkActions = [
    {
      content: "Modifier",
      onAction: () => {
        if (selectedResources.length === 1) {
          const selectedAddressId = selectedResources[0];
          const selectedAddress = adresses.find(
            (address) => address.id === selectedAddressId
          );
          if (selectedAddress) {
            initializeEditAddressForm(selectedAddress);
            openAddressModal();
          } else {
            setMessage("Adresse non trouvée pour l'ID sélectionné.");
            toggleActiveOne();
          }
        } else {
          setMessage("Sélectionnez une seule adresse à modifier.");
          toggleActiveOne();
        }
      },
    },
    {
      content: <Text color="critical">Supprimer</Text>,
      onAction: () => {
        console.log(selectedResources);
        selectedResources.forEach(async (addressId) => {
          await fetch(
            `https://staging.api.creuch.fr/api/deletecustomeraddressbyid`,
            {
              method: "POST",
              body: JSON.stringify({
                customer_id: handle,
                address_id: addressId,
              }),
              headers: { "Content-Type": "application/json" },
            }
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.errors) {
                setMessage(data.errors.base[0]);
              } else {
                setMessage(`Adresse supprimée avec succès pour l'ID ${addressId}`);
              } 
              toggleActiveOne();
              fetchData();
            })
            .catch((error) =>
              console.error(
                "Erreur de suppression d'adresse du client :",
                error
              )
            );
        });
      },
    },
  ];

  const resourceNameOrders = {
    singular: "Commande",
    plural: "Commandes",
  };

  const rowMarkupOrders = orders.map(
    (
      {
        id,
        name,
        processed_at,
        payment_gateway_names,
        financial_status,
        line_items,
        total_price,
        shipping_lines,
        discount_codes,
        current_total_price,
      },
      index
    ) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Link
            dataPrimaryLink
            onClick={() => {
              let orderDetails = {
                name: name,
                emplacement: shipping_lines[0].title,
                line_items: line_items,
                processed_at: processed_at,
                payment_gateway_names: payment_gateway_names,
                financial_status: financial_status,
                total_price: total_price,
                discount_codes: discount_codes,
                current_total_price: current_total_price,
              };
              handleOpenOrderDetails(orderDetails);
            }}
            monochrome
            removeUnderline
          >
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {name}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>{formatDateTime(processed_at)}</IndexTable.Cell>
        <IndexTable.Cell>{payment_gateway_names.toString()}</IndexTable.Cell>
        <IndexTable.Cell>{financial_status}</IndexTable.Cell>
        <IndexTable.Cell>{line_items.length}</IndexTable.Cell>
        <IndexTable.Cell>{total_price} €</IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const resourceNameReductions = {
    singular: "Réduction",
    plural: "Réductions",
  };

  const rowMarkupReductions = abondements.map(
    (
      { id, note, initial_value, balance, currency, created_at, expires_on },
      index
    ) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>{note}</IndexTable.Cell>
        <IndexTable.Cell>
          {initial_value} {currency}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {balance} {currency}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {initial_value-balance} {currency}
        </IndexTable.Cell>
        <IndexTable.Cell>{formatDateTime(created_at)}</IndexTable.Cell>
        <IndexTable.Cell>{formatDateTime(expires_on)}</IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const emptyStateMarkupReductions = (
    <EmptySearchResult
      title={"Aucune réduction"}
      description={"Aucune réduction pour ce client"}
      withIllustration
    />
  );

  // if (isLoading) {
  //   return (
  //     <div style={{ height: "100px" }}>
  //       <Frame>
  //         <Loading />
  //       </Frame>
  //     </div>
  //   );
  // }

  const emptyStateMarkupOrders = (
    <EmptySearchResult
      title={"Aucune commande"}
      description={`${client.first_name} ${client.last_name} n'a pas encore passé de commande`}
      withIllustration
    />
  );

  return (
    <Frame>
      <Page
        fullWidth
        backAction={{ content: "Employés CSE", url: "/salaries" }}
        title={`${client.first_name} ${client.last_name}`}
        subtitle={`${client.default_address?.city}, ${client.default_address?.country}`}
        compactTitle
        /* secondaryActions={[
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
        ]} */
        actionGroups={[
          {
            title: "Autres actions",
            actions: [
              {
                content:
                  client.state == "enabled"
                    ? "Désactiver le compte"
                    : "Activer le compte",
                onAction: () => handleChangeStateCustomer(),
              },
              {
                content: "Réinitialiser le mot de passe du compte",
                onAction: () => openEditCustomerModal(),
              },
              {
                content: <Text color="critical">Supprimer le compte</Text>,
                onAction: () => handleAlert(),
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
        <div>
          <Modal
            open={editCustomer}
            onClose={openEditCustomerModal}
            title="Client"
            primaryAction={{
              content: "Enregistrer",
              onAction: handleEditCustomer,
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: openEditCustomerModal,
              },
            ]}
          >
            <Modal.Section>
              <Form>
                <FormLayout>
                  <Grid>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                    >
                      <TextField
                        label="Prénom"
                        onChange={handleFirstnameChange}
                        value={firstname}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                    >
                      <TextField
                        label="Nom"
                        onChange={handleLastnameChange}
                        value={lastname}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                    >
                      <TextField
                        type="email"
                        label="E-mail"
                        onChange={handleEmailChange}
                        value={email}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                    >
                      <TextField
                        type="password"
                        label="Mot de passe"
                        onChange={handlePasswordChange}
                        value={password}
                        autoComplete="off"
                      />
                    </Grid.Cell>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 12, lg: 12, xl: 12 }}
                    >
                      <Select
                        label="Etat"
                        options={[
                          { label: "Actif", value: "enabled" },
                          { label: "Inactif", value: "disabled" },
                        ]}
                        onChange={handleStateChange}
                        value={state}
                      />
                    </Grid.Cell>
                  </Grid>
                </FormLayout>
              </Form>
            </Modal.Section>
          </Modal>
        </div>
        <div>
          <Modal
            open={modalAdresse}
            onClose={openAddressModal}
            title="Adresse"
            primaryAction={{
              content: "Enregistrer",
              onAction: handleAddressFormSubmit,
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: openAddressModal,
              },
            ]}
          >
            <Modal.Section>
              <Form>
                <FormLayout>
                  <Grid>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <Select
                        label="Pays"
                        options={countries}
                        onChange={(value) =>
                          handleFieldChange("country_code", value)
                        }
                        value={currentAddress.country_code}
                        required="on"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 3, sm: 3, md: 3, lg: 6, xl: 6 }}
                    >
                      <TextField
                        label="Prénom"
                        onChange={(value) =>
                          handleFieldChange("first_name", value)
                        }
                        value={currentAddress.first_name}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 3, sm: 3, md: 3, lg: 6, xl: 6 }}
                    >
                      <TextField
                        label="Nom"
                        onChange={(value) =>
                          handleFieldChange("last_name", value)
                        }
                        value={currentAddress.last_name}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <TextField
                        label="Entreprise"
                        onChange={(value) =>
                          handleFieldChange("company", value)
                        }
                        value={currentAddress.company}
                        autoComplete="off"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <TextField
                        label="Adresse"
                        onChange={(value) =>
                          handleFieldChange("address1", value)
                        }
                        value={currentAddress.address1}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <TextField
                        label="Appartement, suite, etc."
                        onChange={(value) =>
                          handleFieldChange("address2", value)
                        }
                        value={currentAddress.address2}
                        autoComplete="off"
                        required="off"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 3, sm: 3, md: 3, lg: 6, xl: 6 }}
                    >
                      <TextField
                        label="Code postal"
                        onChange={(value) => handleFieldChange("zip", value)}
                        value={currentAddress.zip}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 3, sm: 3, md: 3, lg: 6, xl: 6 }}
                    >
                      <TextField
                        label="Ville"
                        onChange={(value) => handleFieldChange("city", value)}
                        value={currentAddress.city}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <TextField
                        label="Téléphone"
                        onChange={(value) => handleFieldChange("phone", value)}
                        value={currentAddress.phone}
                        autoComplete="off"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <Select
                        label="Défaut"
                        options={[
                          { label: "Oui", value: true },
                          { label: "Non", value: false },
                        ]}
                        onChange={(value) =>
                          handleFieldChange("default", value)
                        }
                        value={currentAddress.default}
                      />
                    </Grid.Cell>
                  </Grid>
                </FormLayout>
              </Form>
            </Modal.Section>
          </Modal>
        </div>
        <div>
          <Modal
            open={alert}
            onClose={handleAlert}
            title={`Supprimer le client ${client.first_name} ${client.last_name}`}
            primaryAction={{
              content: "Oui",
              onAction: () => handleDeleteCustomer,
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: handleAlert,
              },
            ]}
          >
            <Modal.Section>
              <TextContainer>
                <p>
                  Êtes-vous sûr de vouloir supprimer le compte de{" "}
                  <strong>
                    {client.first_name} {client.last_name}
                  </strong>{" "}
                  ?
                </p>
              </TextContainer>
            </Modal.Section>
          </Modal>
        </div>
        <div>
          <Modal
            open={modalOrder}
            onClose={openOrderModal}
            title="Commande"
            secondaryActions={[
              {
                content: "Fermer",
                onAction: openOrderModal,
              },
            ]}
          >
            <Modal.Section>
              {selectedOrder !== null && (
                <VerticalStack gap="4">
                  <Box
                    padding="4"
                    background="bg"
                    borderRadius="1"
                    borderColor="border"
                    borderWidth="1"
                  >
                    <HorizontalGrid gap="4">
                      <Box>
                        <Box>
                          <VerticalStack gap="5">
                            <HorizontalGrid gap="3">
                              <Text as="p" fontWeight="semibold">
                                Emplacement
                              </Text>
                              {selectedOrder.emplacement}
                              <Text as="p" fontWeight="semibold">
                                Mode de livraison
                              </Text>
                              {selectedOrder.line_items[0].fulfillment_service}
                              <Text as="p" fontWeight="semibold">
                                Heure de ramassage prévue
                              </Text>
                              {formatDateTime(selectedOrder.processed_at)}
                            </HorizontalGrid>
                          </VerticalStack>
                        </Box>
                      </Box>
                    </HorizontalGrid>
                  </Box>
                  <Box
                    padding="4"
                    background="bg"
                    borderRadius="1"
                    borderColor="border"
                    borderWidth="1"
                  >
                    <HorizontalGrid gap="4">
                      <Box>
                        <Box>
                          <VerticalStack gap="5">
                            <HorizontalGrid gap="3">
                              <Text as="h2" fontWeight="semibold">
                                Produits
                              </Text>
                              {selectedOrder.line_items.map((item, index) => (
                                <div key={index}>
                                  <Text as="p">
                                    Nom du produit : {item.name}
                                  </Text>
                                  <Text as="p">Prix : {item.price} €</Text>
                                  <Text as="p">Quantité : {item.quantity}</Text>
                                </div>
                              ))}
                            </HorizontalGrid>
                          </VerticalStack>
                        </Box>
                      </Box>
                    </HorizontalGrid>
                  </Box>
                  <Box
                    padding="4"
                    background="bg"
                    borderRadius="1"
                    borderColor="border"
                    borderWidth="1"
                  >
                    <HorizontalGrid gap="4">
                      <Box>
                        <Box>
                          <VerticalStack gap="5">
                            <HorizontalGrid gap="4">
                              <Text as="h2" fontWeight="semibold">
                                Résumé de la commande
                              </Text>
                              <Text as="p">
                                Sous-total : {selectedOrder.current_total_price}{" "}
                                €
                              </Text>
                              <Text as="p">
                                Nombre d'articles :{" "}
                                {selectedOrder.line_items.length}
                              </Text>
                              <Text as="p">
                                Code de Réduction :{" "}
                                {selectedOrder.discount_codes[0].code}
                              </Text>
                              <Text as="p">
                                Réduction Prix :{" "}
                                {selectedOrder.discount_codes[0].amount} €
                              </Text>
                              <Text as="p">
                                Point de retrait : {selectedOrder.emplacement}
                              </Text>
                              <Text as="p">
                                Total : {selectedOrder.total_price} €
                              </Text>
                            </HorizontalGrid>
                          </VerticalStack>
                        </Box>
                      </Box>
                    </HorizontalGrid>
                  </Box>
                </VerticalStack>
              )}
            </Modal.Section>
          </Modal>
        </div>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <LegacyCard
              title={`${client.first_name} ${client.last_name}`}
              actions={[
                { content: `${client.email}`, url: `mailto:${client.email}` },
                {
                  content: <Icon source={EditMajor} color="base" />,
                  onAction: () => openEditCustomerModal(),
                },
              ]}
            >
              <LegacyCard.Section>
                <VerticalStack gap="3">
                  <Divider borderColor="border" />
                  <Text as="h1">Matricule : {metafields[1]?.value}</Text>
                  <Divider borderColor="border" />
                  <Text as="h1">Code CSE : {metafields[0]?.value}</Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Date d'inscription : {formatDateTime(client.created_at)}
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Dernière mise à Jour : {formatDateTime(client.updated_at)}
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    État :{" "}
                    {client.state === "enabled" ? (
                      <Badge status="success">Actif</Badge>
                    ) : (
                      <Badge status="critical">Inactif</Badge>
                    )}
                  </Text>
                </VerticalStack>
              </LegacyCard.Section>
            </LegacyCard>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <LegacyCard title="Commandes">
              <LegacyCard.Section>
                <IndexTable
                  resourceName={resourceNameOrders}
                  itemCount={orders.length}
                  emptyState={emptyStateMarkupOrders}
                  headings={[
                    { title: "ID" },
                    { title: "Date" },
                    { title: "Paiement" },
                    { title: "État" },
                    { title: "Produits" },
                    { title: "Total payé" },
                  ]}
                  selectable={false}
                >
                  {rowMarkupOrders}
                </IndexTable>
              </LegacyCard.Section>
            </LegacyCard>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <LegacyCard title="Abondements">
              <LegacyCard.Section>
                <IndexTable
                  resourceName={resourceNameReductions}
                  itemCount={abondements.length}
                  emptyState={emptyStateMarkupReductions}
                  headings={[
                    { title: "Code" },
                    { title: "Reduction" },
                    { title: "Balance" },
                    { title: "Utilisé" },
                    { title: "Créer le" },
                    { title: "Expiration" },
                  ]}
                  selectable={false}
                >
                  {rowMarkupReductions}
                </IndexTable>
              </LegacyCard.Section>
            </LegacyCard>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 12, lg: 12, xl: 12 }}>
            <LegacyCard
              title="Adresses"
              actions={[
                {
                  content: "Ajouter",
                  onAction: () => {
                    initializeAddressForm();
                    openAddressModal();
                  },
                },
              ]}
            >
              <LegacyCard.Section>
                <IndexTable
                  resourceName={resourceName}
                  itemCount={adresses.length}
                  selectedItemsCount={
                    allResourcesSelected ? "All" : selectedResources.length
                  }
                  emptyState={emptyStateMarkup}
                  onSelectionChange={handleSelectionChange}
                  headings={[
                    { title: "ID" },
                    { title: "Société" },
                    { title: "Nom" },
                    { title: "Adresse" },
                    { title: "Pays" },
                    { title: "Numéro(s) de téléphone" },
                    { title: "Par défaut" },
                  ]}
                  selectable={true}
                  bulkActions={bulkActions}
                >
                  {rowMarkup}
                </IndexTable>
              </LegacyCard.Section>
            </LegacyCard>
          </Grid.Cell>
        </Grid>
        {toastMarkup1}
      </Page>
    </Frame>
  );
};
