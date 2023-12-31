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
  ResourceList,
  Thumbnail,
  List,
} from "@shopify/polaris";
import {
  ImageMajor,
  MarkPaidMinor,
} from "@shopify/polaris-icons";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

export default function OrderDetail() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const { handle } = useParams();
  const [order, setOrder] = useState({
    shipping_lines: [],
    line_items: [],
    payment_gateway_names: [],
    billing_address: {},
    shipping_address: {},
    customer: {},
    metafields: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeOne, setActiveOne] = useState(false);
  const [message, setMessage] = useState("");
  const toggleActiveOne = useCallback(() => setActiveOne((activeOne) => !activeOne), []);

  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState({
    title: "",
    message: "",
    function: () => {},
  });
  const handleAlert = useCallback(() => setAlert(!alert), [alert]);

  const handleChangeStatus = useCallback(async (handle, product_id, statut) => {
    setIsLoading(true);
    await fetch(`https://staging.api.creuch.fr/api/update_order_product_status`, {
      method: "POST",
      body: JSON.stringify({
        order: handle,
        product_id: product_id,
        status: statut,
      }),
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setMessage("Statut de livraison de produit mise a jour avec succès.");
        toggleActiveOne();
        fetchData();
      })
      .catch((error) => {
        console.error(
          "Erreur de modification de statut de produit dans la commande :",
          error
        );
        setMessage(
          "Erreur de modification de statut de produit dans la commande."
        );
        toggleActiveOne();
      });
  }, []);

  const handleCancelOrder = useCallback(async () => {
    setIsLoading(true);
    await fetch(`https://staging.api.creuch.fr/api/cancel_order`, {
      method: "POST",
      body: JSON.stringify({
        id: handle
      }),
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.error) {
          setMessage(data.error);
        } else {
          setMessage("Commande annulée.");
        }
        toggleActiveOne();
        fetchData();
      })
      .catch((error) => {
        console.error(
          "Erreur de modification de statut de produit dans la commande :",
          error
        );
        setMessage(
          "Erreur de modification de statut de produit dans la commande."
        );
        toggleActiveOne();
      });
    setAlert(false);
  }, [handle]);

  const handleDeleteOrder = useCallback(async () => {
    setIsLoading(true);
    await fetch(`https://staging.api.creuch.fr/api/delete_order`, {
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
        setMessage("Commande supprimée.");
        toggleActiveOne();
        fetchData();
      })
      .catch((error) => {
        console.error(
          "Erreur de modification de statut de produit dans la commande :",
          error
        );
        setMessage(
          "Erreur de modification de statut de produit dans la commande."
        );
        toggleActiveOne();
      });
    setAlert(false);
  }, [handle]);

  const handleRefundOrder = useCallback(async () => {
    setIsLoading(true);
    await fetch(`https://staging.api.creuch.fr/api/refund_order`, {
      method: "POST",
      body: JSON.stringify({
        id: handle,
        line_items: order.line_items,
      }),
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.errors) {
          data.errors.base.forEach((error) => {
            setMessage(error);
          })
        } else {
          setMessage("Commande remboursé.");
        }
        toggleActiveOne();
        fetchData();
      })
      .catch((error) => {
        console.error(error);
        setMessage("Erreur de remboursement de commande.");
        toggleActiveOne();
        setIsLoading(false);
      });
  }, [handle, order])

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
  
  const fetchData = async () => {
    setIsLoading(true);
    await fetch(`https://staging.api.creuch.fr/api/get_order`, {
      method: "POST",
      body: JSON.stringify({order: handle}),
      headers: {
        "Content-type": "application/json"
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const order = data.order;
        console.log(order);
        if (order.errors) {
          redirect.dispatch(Redirect.Action.APP, "/orders");
        } else {
          setOrder(order);
          setIsLoading(false);
        }
      })
      .catch((error) =>
        console.error("Erreur de chargement des détails de la commande :", error)
      );
  };

  useEffect(() => {
    fetchData();
  }, [handle]);

  function getMetafieldStatus(keyToCheck, metafieldValue) {
    const parsedMetafield = JSON.parse(metafieldValue);
    if (parsedMetafield.hasOwnProperty(keyToCheck)) {
      return parsedMetafield[keyToCheck];
    } else {
      return "NON TROUVÉ";
    }
  }

  async function processOrderItem(id, type){
   if(type=="refund"){
      redirect.dispatch(Redirect.Action.ADMIN_PATH, "/orders/"+id+"/refund");
    }
    else{
      setIsLoading(true);
      await fetch(`https://staging.api.creuch.fr/api/order_process`, {
      method: "POST",
      body: JSON.stringify({
        order: id,
        type : type
      }),
      headers: {
        "Content-type": "application/json"
      },
    })
      .then(response => response.blob())
      .then((data) => {
        setIsLoading(false);
        downloadBlob(data,  'crecuh'+type+'.pdf') 
        console.log("fichier", data);

      })
      .catch((error) =>
        console.error("Erreur de chargement des détails de la commande :", error)
      );
    }
  }

  async function processOrder(id, product, type) {
    if(type=="refund"){
      redirect.dispatch(Redirect.Action.ADMIN_PATH, "/orders/"+id+"/refund");
    }
    else{
      setIsLoading(true);
      await fetch(`https://staging.api.creuch.fr/api/process`, {
      method: "POST",
      body: JSON.stringify({
        order: id,
        product : product,
        type : type
      }),
      headers: {
        "Content-type": "application/json"
      },
    })
      .then(response => response.blob())
      .then((data) => {
        setIsLoading(false);
        downloadBlob(data,  'crecuh'+type+'.pdf') 
        console.log("fichier", data);

      })
      .catch((error) =>
        console.error("Erreur de chargement des détails de la commande :", error)
      );
    }
  }

  function downloadBlob(blob, name) {
    if (
      window.navigator && 
      window.navigator.msSaveOrOpenBlob
    ) return window.navigator.msSaveOrOpenBlob(blob);

    // For other browsers:
    // Create a link pointing to the ObjectURL containing the blob.
    const data = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = data;
    link.download = name;

    // this is necessary as link.click() does not work on the latest firefox
    link.dispatchEvent(
      new MouseEvent('click', { 
        bubbles: true, 
        cancelable: true, 
        view: window 
      })
    );

    setTimeout(() => {
      // For Firefox it is necessary to delay revoking the ObjectURL
      window.URL.revokeObjectURL(data);
      link.remove();
    }, 100);
  }
  
  return (
    <Frame>
      <Page
        fullWidth
        backAction={{ content: "Commandes CSE", url: "/orders" }}
        title={`${order.name}`}
        subtitle={`le ${formatDateTime(order.created_at)}`}
        compactTitle
        actionGroups={[
          {
            title: "Autres actions",
            actions: [
              {
                content: <Text color="warning">Imprimer la facture</Text>,
                onAction: () => {
                  processOrderItem(handle, "bill");
                },
              },
              {
                content: (
                  <Text color="success">Imprimer le bon de livraison</Text>
                ),
                onAction: () => {
                  processOrderItem(handle, "bl");
                },
              },
              order.refunds?.length === 0
                ? {
                    content: <Text color="warning">Rembourser</Text>,
                    onAction: () => {
                      setAlertMessage({
                        title: "Rembourser le client",
                        message: (
                          <Text as="p">
                            Êtes-vous sûr de vouloir rembourser la commande{" "}
                            <strong>{order.name}</strong> ?
                          </Text>
                        ),
                        function: handleRefundOrder,
                      });
                      handleAlert();
                    },
                    disabled: order.refunds?.length === 0 ? false : true,
                  }
                : {},
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
            open={alert}
            onClose={handleAlert}
            title={alertMessage.title}
            primaryAction={{
              content: "Oui",
              onAction: () => alertMessage.function(),
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: handleAlert,
              },
            ]}
          >
            <Modal.Section>{alertMessage.message}</Modal.Section>
          </Modal>
        </div>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 8, xl: 8 }}>
            <LegacyCard
              title={
                <Text as="p" fontWeight="semibold">
                  Status de la commande {"  "}
                  <Badge progress="complete" status="paid">
                    {order.refunds?.length > 0
                      ? "Totalement Renmboursé"
                      : order.financial_status == "paid"
                      ? "Payé"
                      : order.financial_status == "partially_refunded"
                      ? "Partiellement Remboursé"
                      : "None"}
                  </Badge>
                  {"  "}
                  {order.fulfillment_status == null ? (
                    <Badge progress="incomplete" status="attention">
                      En cours
                    </Badge>
                  ) : order.fulfillment_status == "fulfilled" ? (
                    <Badge progress="complete" status="success">
                      Traité
                    </Badge>
                  ) : (
                    ""
                  )}{" "}
                  {order.cancelled_at != null ? (
                    <Badge progress="complete" status="paid">
                      Annulé
                    </Badge>
                  ) : (
                    ""
                  )}{" "}
                  {order.metafields.length >= 2 &&
                  order.metafields[1].value == true ? (
                    <Badge progress="complete" status="critical">
                      Supprimée
                    </Badge>
                  ) : (
                    ""
                  )}
                </Text>
              }
              actions={[
                {
                  content:
                    order.cancelled_at == null ? (
                      <button
                        className="Polaris-Button Polaris-Button--sizeSlim"
                        type="button"
                        style={{
                          backgroundColor: "#303030",
                          color: "white",
                        }}
                        onClick={() => {
                          setAlertMessage({
                            title: "Annuler la commande",
                            message: (
                              <Text as="p">
                                Êtes-vous sûr de vouloir annuler la commande{" "}
                                <strong>{order.name}</strong> ?
                              </Text>
                            ),
                            function: handleCancelOrder,
                          });
                          handleAlert();
                        }}
                      >
                        <span className="Polaris-Button__Content">
                          <span className="Polaris-Button__Text">
                            Annuler la commande
                          </span>
                        </span>
                      </button>
                    ) : (
                      ""
                    ),
                },
              ]}
            >
              <LegacyCard.Section>
                <HorizontalGrid gap="3">
                  <Text as="p" fontWeight="semibold">
                    Emplacement
                  </Text>
                  {order.shipping_lines.length >= 1
                    ? order.shipping_lines[0].title
                    : ""}
                  <Text as="p" fontWeight="semibold">
                    Mode de livraison
                  </Text>
                  {order.line_items.length >= 1
                    ? order.line_items[0].fulfillment_service
                    : ""}
                  <Text as="p" fontWeight="semibold">
                    Heure de ramassage prévue
                  </Text>
                  {formatDateTime(order.processed_at)}
                </HorizontalGrid>
              </LegacyCard.Section>
              <LegacyCard.Section title="Produits">
                <ResourceList
                  resourceName={{ singular: "product", plural: "products" }}
                  items={order.line_items.map((item) => ({
                    id: item.id.toString(),
                    url: "#",
                    name: item.name,
                    price: item.price,
                    sku: item.sku,
                    quantity: item.quantity.toString(),
                    media: (
                      <Thumbnail
                        source={
                          item.product?.image?.src
                            ? item.product.image.src
                            : ImageMajor
                        }
                        alt={item.name}
                      />
                    ),
                    product_id: item.product_id,
                  }))}
                  renderItem={(item) => {
                    const {
                      id,
                      url,
                      name,
                      price,
                      sku,
                      media,
                      quantity,
                      product_id,
                    } = item;

                    return (
                      <ResourceList.Item
                        id={id}
                        url={url}
                        media={media}
                        accessibilityLabel={`View details for ${name}`}
                      >
                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                          {name}
                        </Text>
                        <div>SKU: {sku}</div>
                        <div>Prix: {price} €</div>
                        <div>Quantité: {quantity}</div>
                        <div>
                          Statut:{" "}
                          {order.metafields.length >= 1
                            ? getMetafieldStatus(
                                product_id,
                                order.metafields[0]?.value
                              )
                            : "NONE"}
                        </div>
                        <br />
                        {order.metafields.length >= 1 ? (
                          getMetafieldStatus(
                            product_id,
                            order.metafields[0]?.value
                          ) == "PAYE" ? (
                            <button
                              className="Polaris-Button Polaris-Button--sizeSlim"
                              type="button"
                              style={{
                                backgroundColor: "#17a2b8",
                                color: "white",
                              }}
                              onClick={() =>
                                handleChangeStatus(
                                  handle,
                                  product_id,
                                  "EN PREPARATION"
                                )
                              }
                            >
                              <span className="Polaris-Button__Content">
                                <span className="Polaris-Button__Text">
                                  Marquer en préparation
                                </span>
                              </span>
                            </button>
                          ) : getMetafieldStatus(
                              product_id,
                              order.metafields[0]?.value
                            ) == "EN PREPARATION" ? (
                            <button
                              className="Polaris-Button Polaris-Button--sizeSlim"
                              type="button"
                              style={{
                                backgroundColor: "#17a2b8",
                                color: "white",
                              }}
                              onClick={() =>
                                handleChangeStatus(
                                  handle,
                                  product_id,
                                  "LIVRE CREUCH STORE"
                                )
                              }
                            >
                              <span className="Polaris-Button__Content">
                                <span className="Polaris-Button__Text">
                                  Livré au creuch store
                                </span>
                              </span>
                            </button>
                          ) : getMetafieldStatus(
                              product_id,
                              order.metafields[0]?.value
                            ) == "LIVRE CREUCH STORE" ? (
                            <button
                              className="Polaris-Button Polaris-Button--sizeSlim"
                              type="button"
                              style={{
                                backgroundColor: "#28a745",
                                color: "white",
                              }}
                              onClick={() =>
                                handleChangeStatus(
                                  handle,
                                  product_id,
                                  "LIVRE CLIENT"
                                )
                              }
                            >
                              <span className="Polaris-Button__Content">
                                <span className="Polaris-Button__Text">
                                  Livré au client
                                </span>
                              </span>
                            </button>
                          ) : (
                            <div>
                              <Text as="p" fontWeight="bold">
                                Livré au client
                              </Text>
                              <br />
                            </div>
                          )
                        ) : (
                          ""
                        )}
                        <button
                          className="Polaris-Button Polaris-Button--sizeSlim"
                          type="button"
                          style={{
                            backgroundColor: "#17D438",
                            color: "white",
                          }}
                          onClick={() => processOrder(handle, product_id, "bl")}
                        >
                          <span className="Polaris-Button__Content">
                            <span className="Polaris-Button__Text">
                              Imprimer le bon de livraison
                            </span>
                          </span>
                        </button>
                        <button
                          className="Polaris-Button Polaris-Button--sizeSlim"
                          type="button"
                          style={{
                            backgroundColor: "#226666",
                            color: "white",
                          }}
                          onClick={() =>
                            processOrder(handle, product_id, "bill")
                          }
                        >
                          <span className="Polaris-Button__Content">
                            <span className="Polaris-Button__Text">
                              Imprimer la facture
                            </span>
                          </span>
                        </button>
                        <button
                          className="Polaris-Button Polaris-Button--sizeSlim"
                          type="button"
                          style={{
                            backgroundColor: "#AA3939",
                            color: "white",
                          }}
                          onClick={() =>
                            processOrder(handle, product_id, "refund")
                          }
                        >
                          <span className="Polaris-Button__Content">
                            <span className="Polaris-Button__Text">
                              Rembourser le client
                            </span>
                          </span>
                        </button>
                      </ResourceList.Item>
                    );
                  }}
                />
              </LegacyCard.Section>
            </LegacyCard>
            <LegacyCard
              title={
                <Badge icon={MarkPaidMinor} size="large">
                  Payée
                </Badge>
              }
            >
              <LegacyCard.Section>
                <Box borderColor="border" borderWidth="1" padding="3">
                  <LegacyCard.Subsection>
                    <HorizontalGrid gap="4">
                      <HorizontalGrid>
                        <Text as="p" fontWeight="semibold">
                          Sous-total :{" "}
                          {order.current_subtotal_price_set?.shop_money?.amount}{" "}
                          {
                            order.current_subtotal_price_set?.shop_money
                              ?.currency_code
                          }
                        </Text>
                      </HorizontalGrid>
                      <HorizontalGrid>
                        <Text as="p">
                          Nombre d'articles : {order.line_items?.length}
                        </Text>
                      </HorizontalGrid>
                      <HorizontalGrid>
                        <Text as="p">
                          Point de retrait :{" "}
                          {order.shipping_lines.length >= 1
                            ? order.shipping_lines[0].title
                            : ""}
                        </Text>
                      </HorizontalGrid>
                      <HorizontalGrid>
                        <Text as="p" fontWeight="semibold">
                          Total :{" "}
                          {order.current_total_price_set?.shop_money?.amount}{" "}
                          {
                            order.current_total_price_set?.shop_money
                              ?.currency_code
                          }
                        </Text>
                      </HorizontalGrid>
                      <HorizontalGrid>
                        <Text as="p" fontWeight="semibold">
                          Moyen de paiement
                        </Text>
                        <List type="bullet">
                          {order.payment_gateway_names.map(
                            (payment_gateway_name, index) => (
                              <List.Item key={index}>
                                <div>
                                  <Text as="p">
                                    {payment_gateway_name === "gift_card"
                                      ? "Abondement"
                                      : payment_gateway_name === "manual"
                                      ? "Manuel"
                                      : payment_gateway_name === "stripe"
                                      ? "Carte de crédit"
                                      : payment_gateway_name}
                                  </Text>
                                  {order.transactions.map(
                                    (transaction, transactionIndex) => {
                                      if (
                                        transaction.gateway ===
                                          payment_gateway_name &&
                                        transaction.status === "success"
                                      ) {
                                        return (
                                          <List
                                            key={transactionIndex}
                                            type="bullet"
                                          >
                                            <List.Item>
                                              {transaction.kind === "sale"
                                                ? "Payé: "
                                                : "Remboursé: "}
                                              {transaction.amount}{" "}
                                              {transaction.currency}
                                            </List.Item>
                                          </List>
                                        );
                                      }
                                    }
                                  )}
                                </div>
                              </List.Item>
                            )
                          )}
                        </List>
                      </HorizontalGrid>
                    </HorizontalGrid>
                  </LegacyCard.Subsection>
                </Box>
              </LegacyCard.Section>
            </LegacyCard>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
            <LegacyCard title="Client" actions={[]}>
              <LegacyCard.Section title="Coordonnées">
                <HorizontalGrid>
                  <Link dataPrimaryLink url={`/salaries/${order.customer.id}`}>
                    <Text as="span">{order.customer.email}</Text>
                  </Link>
                  <Text as="span">{order.customer.first_name}</Text>
                  <Text as="span">{order.customer.last_name}</Text>
                  <Text as="span">{order.customer.phone}</Text>
                </HorizontalGrid>
              </LegacyCard.Section>
              <LegacyCard.Section title="Adresse d'expédition">
                {order.shipping_address ? (
                  <Text as="span">{order.shipping_address?.address1}</Text>
                ) : (
                  <Text as="span">Aucune adresse d'expédition fournie</Text>
                )}
              </LegacyCard.Section>
              <LegacyCard.Section title="Adresse de facturation">
                <HorizontalGrid>
                  <Text as="span">{order.billing_address?.name}</Text>
                  <Text as="span">{order.billing_address?.city}</Text>
                  <Text as="span">{order.billing_address?.country}</Text>
                </HorizontalGrid>
              </LegacyCard.Section>
            </LegacyCard>
          </Grid.Cell>
        </Grid>
        <Grid>
          <Grid.Cell
            columnSpan={{ xs: 6, sm: 6, md: 4, lg: 9, xl: 10 }}
          ></Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 2, lg: 3, xl: 2 }}>
            {order.metafields.length >= 2 &&
            order.metafields[1].value == false ? (
              <button
                className="Polaris-Button Polaris-Button--sizeSlim"
                type="button"
                style={{
                  backgroundColor: "#e51c00",
                  color: "white",
                }}
                onClick={() => {
                  setAlertMessage({
                    title: "Supprimer la commande",
                    message: (
                      <Text as="p">
                        Êtes-vous sûr de vouloir supprimer la commande{" "}
                        <strong>{order.name}</strong> ?
                      </Text>
                    ),
                    function: handleDeleteOrder,
                  });
                  handleAlert();
                }}
              >
                <span className="Polaris-Button__Content">
                  <span className="Polaris-Button__Text">
                    Supprimer la commande
                  </span>
                </span>
              </button>
            ) : (
              ""
            )}
          </Grid.Cell>
        </Grid>
        {toastMarkup1}
      </Page>
    </Frame>
  );
};
