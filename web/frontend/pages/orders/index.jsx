import {
  Page,
  Text,
  Link,
  Frame,
  Badge,
  Layout,
  Loading,
  LegacyCard,
  Select,
  IndexTable,
  EmptySearchResult,
  useIndexResourceState,
  Thumbnail,
  Modal,
  IndexFilters,
  useSetIndexFiltersMode,
  ChoiceList,
  Pagination,
  Box,
  Tooltip,
  Button,
  Icon,
  Grid,
} from "@shopify/polaris";
import { ImageMajor, ExportMinor } from "@shopify/polaris-icons";
import { useState, useEffect, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from '@shopify/app-bridge/actions';
import { utils, writeFileXLSX } from "xlsx";
export { utils, writeFileXLSX };

export default function OrdersPage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [cse, setCse] = useState([]);
  
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
    return new Intl.DateTimeFormat("fr-FR", options).format(inputDate);
  }

  const resourceName = {singular: "Commande", plural: "Commandes"};

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(filteredOrders);
  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucune commande trouvée"}
      description={
        "Essayez de modifier les filtres ou les termes de recherche"
      }
      withIllustration
    />
  );

  function financialStatusBadge(status) {
    switch (status) {
      case "paid":
        return (
          <Badge progress="complete" status="paid">
            Payée
          </Badge>
        );
      case "partially_refunded":
        return (
          <Badge progress="partiallyComplete" status="partially_refunded">
            Partiellement remboursée
          </Badge>
        );
      case "partially_paid":
        return (
          <Badge progress="partiallyComplete" status="partially_paid">
            Partiellement payée
          </Badge>
        );
      case "refunded":
        return (
          <Badge progress="complete" status="refunded">
            Remboursée
          </Badge>
        );
      case "pending":
        return (
          <Badge progress="incomplete" status="pending">
            En attente
          </Badge>
        );
      default:
        return (
          <Badge progress="incomplete" status="attention">
            État inconnu
          </Badge>
        );
    }
  }

  function fulfillmentStatusBadge(status) {
    switch (status) {
      case "fulfilled":
        return (
          <Badge progress="complete" status="fulfilled">
            Traitée
          </Badge>
        );
      case null:
        return (
          <Badge progress="incomplete" status="attention">
            En cours
          </Badge>
        );
      case "partial":
        return (
          <Badge progress="partiallyComplete" status="partial">
            Traitement partielle
          </Badge>
        );
      case "restocked":
        return (
          <Badge progress="partiallyComplete" status="restocked">
            Restockage
          </Badge>
        );
      default:
        return (
          <Badge progress="incomplete" status="attention">
            État inconnu
          </Badge>
        );
    }
  }

  const rowMarkup = filteredOrders.map((order, index) => (
    <IndexTable.Row
      id={order.id}
      key={order.id}
      selected={selectedResources.includes(order.id)}
      position={index}
      subdued={
        order.fulfillment_status === null
          ? false
          : order.fulfillment_status === "fulfilled"
          ? true
          : false
      }
      status={
        order.fulfillment_status === null
          ? ""
          : order.fulfillment_status === "fulfilled"
          ? "subdued"
          : ""
      }
    >
      <IndexTable.Cell>
        <Link
          dataPrimaryLink
          url={`/orders/${order.id}`}
          monochrome
          removeUnderline
        >
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {order.name}
          </Text>
        </Link>
      </IndexTable.Cell>
      <IndexTable.Cell>{formatDateTime(order.created_at)}</IndexTable.Cell>
      <IndexTable.Cell>
        {`${order.customer.first_name} ${order.customer.last_name}`}
      </IndexTable.Cell>
      <IndexTable.Cell>{`${order.total_discounts} €`}</IndexTable.Cell>
      <IndexTable.Cell>{`${order.total_price} €`}</IndexTable.Cell>
      <IndexTable.Cell>
        {financialStatusBadge(order.financial_status)}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {fulfillmentStatusBadge(order.fulfillment_status)}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const exportToExcel = async () => {
    const tableau = filteredOrders.map((order, index) => {
      const status = order.financial_status;
      const status_order = order.fulfillment_status;
      return {
        Commande: order.name,
        Date: formatDateTime(order.created_at),
        Client: order.customer.first_name + " " + order.customer.last_name,
        Abondements: order.total_discounts + " €",
        Total: order.total_price + " €",
        "Statut du paiement":
          status === "paid"
            ? "Payée"
            : status === "partially_refunded"
            ? "Partiellement remboursée"
            : status === "partially_paid"
            ? "Partiellement payée"
            : status === "refunded"
            ? "Remboursée"
            : status === "pending"
            ? "En attente"
            : "État inconnu",
        "Statut des commandes":
          status_order === "fulfilled"
            ? "Traitée"
            : status_order === null
            ? "En cours"
            : status_order === "partial"
            ? "Traitement partielle"
            : status_order === "restocked"
            ? "Restockage"
            : "État inconnu",
      };
    });
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(tableau);
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFileXLSX(wb, "Commandes.xlsx");
  };

  const bulkActions = [
    {
      content: "Supprimer les commandes",
      onAction: () => console.log("Todo: implement bulk remove tags"),
    },
  ];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const [itemStrings, setItemStrings] = useState([
    "Toutes"
  ]);
  const deleteView = (index) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const duplicateView = async (name) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };

  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions:
      index === 0
        ? []
        : [
            {
              type: "rename",
              onAction: () => {},
              onPrimaryAction: async (value) => {
                const newItemsStrings = tabs.map((item, idx) => {
                  if (idx === index) {
                    return value;
                  }
                  return item.content;
                });
                await sleep(1);
                setItemStrings(newItemsStrings);
                return true;
              },
            },
            {
              type: "duplicate",
              onPrimaryAction: async (value) => {
                await sleep(1);
                duplicateView(value);
                return true;
              },
            },
            {
              type: "edit",
            },
            {
              type: "delete",
              onPrimaryAction: async () => {
                await sleep(1);
                deleteView(index);
                return true;
              },
            },
          ],
  }));
  const [selected, setSelected] = useState(0);
  const onCreateNewView = async (value) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };

  const sortOptions = [
    {
      label: "Numéro de commande",
      value: "commande asc",
      directionLabel: "Croissant",
    },
    {
      label: "Numéro de commande",
      value: "commande desc",
      directionLabel: "Décroissant",
    },
    { label: "Date", value: "date asc", directionLabel: "A-Z" },
    { label: "Date", value: "date desc", directionLabel: "Z-A" },
    { label: "Client", value: "client asc", directionLabel: "A-Z" },
    { label: "Client", value: "client desc", directionLabel: "Z-A" },
    { label: "Total", value: "total asc", directionLabel: "Croissant" },
    { label: "Total", value: "total desc", directionLabel: "Décroissant" },
    {
      label: "Statut du paiement",
      value: "paiement asc",
      directionLabel: "A-Z",
    },
    {
      label: "Statut du paiement",
      value: "paiement desc",
      directionLabel: "Z-A",
    },
    {
      label: "Statut du traitement de la commande",
      value: "traitement asc",
      directionLabel: "A-Z",
    },
    {
      label: "Statut du traitement de la commande",
      value: "traitement desc",
      directionLabel: "Z-A",
    },
  ];
  const [sortSelected, setSortSelected] = useState(["commande asc"]);
  const handleSortSelected = useCallback(
    (value) => {
      setSortSelected(value);
      const [sortKey, sortDirection] = value[0].split(" ");
      const sortedOrders = [...filteredOrders];

      switch (sortKey) {
        case "commande":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.name.localeCompare(b.name);
            } else {
              return b.name.localeCompare(a.name);
            }
          });
          break;
        case "date":
          sortedOrders.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            if (sortDirection === "asc") {
              return dateA - dateB;
            } else {
              return dateB - dateA;
            }
          });
          break;
        case "client":
          sortedOrders.sort((a, b) => {
            const nameA = `${a.customer.first_name} ${a.customer.last_name}`;
            const nameB = `${b.customer.first_name} ${b.customer.last_name}`;
            if (sortDirection === "asc") {
              return nameA.localeCompare(nameB);
            } else {
              return nameB.localeCompare(nameA);
            }
          });
          break;
        case "total":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.total_price - b.total_price;
            } else {
              return b.total_price - a.total_price;
            }
          });
          break;
        case "paiement":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.financial_status.localeCompare(b.financial_status);
            } else {
              return b.financial_status.localeCompare(a.financial_status);
            }
          });
          break;
        case "traitement":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return (a.fulfillment_status || "").localeCompare(b.fulfillment_status || "");
            } else {
              return (b.fulfillment_status || "").localeCompare(a.fulfillment_status || "");
            }
          });
          break;
        default:
          break;
      }
      setFilteredOrders(sortedOrders);
    },
    [filteredOrders]
  );

  const {mode, setMode} = useSetIndexFiltersMode();
  const onHandleCancel = () => {
    setCse([]);
    setFilteredOrders(orders);
  };

  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction =
    selected === 0
      ? {
          type: 'save-as',
          onAction: onCreateNewView,
          disabled: false,
          loading: false,
        }
      : {
          type: 'save',
          onAction: onHandleSave,
          disabled: false,
          loading: false,
        };
  
  const [commandeStatus, setCommandeStatus] = useState([]);
  const [paiementStatus, setPaiementStatus] = useState([]);
  const [queryValue, setQueryValue] = useState('');

  const handleCommandeStatusChange = useCallback(
    (value) => {
      setCommandeStatus(value);
      const filteredOrders = orders.filter((order) => {
        if (value.length === 0) {
          return true;
        }
        return value.includes(String(order.fulfillment_status));
      });

      setFilteredOrders(filteredOrders);
    },
    [orders, filteredOrders]
  );
  const handlePaiementStatusChange = useCallback(
    (value) => {
      setPaiementStatus(value);
      const filteredOrders = orders.filter((order) => {
        if (value.length === 0) {
          return true;
        }
        return value.includes(String(order.financial_status));
      });

      setFilteredOrders(filteredOrders);
    },
    [orders, filteredOrders]
  );

  const handleFiltersQueryChange = useCallback((value) => {
    setQueryValue(value);
    const searchValueLower = value.toLowerCase();
    if (searchValueLower === "") {
      setFilteredOrders(orders);
    } else {
      const filteredOrders = orders.filter(
        (order) =>
          order.name.toLowerCase().includes(searchValueLower) ||
          `${order.customer.first_name} ${order.customer.last_name}`
            .toLowerCase()
            .includes(searchValueLower) ||
          order.total_discounts
            .toString()
            .toLowerCase()
            .includes(searchValueLower) ||
          order.total_price
            .toString()
            .toLowerCase()
            .includes(searchValueLower) ||
          order.financial_status.toLowerCase().includes(searchValueLower) ||
          (order.fulfillment_status &&
            order.fulfillment_status.toLowerCase().includes(searchValueLower))
      );
      setFilteredOrders(filteredOrders);
    }
  }, [orders]);

  const handleFiltersQueryClear = useCallback(() => {
    setQueryValue("");
    var filteredOrders = orders;
    if (paiementStatus.length >= 1) {
      filteredOrders = filteredOrders.filter((order) => {
        if (paiementStatus.length === 0) {
          return true;
        }
        return paiementStatus.includes(String(order.financial_status));
      });
    }
    if (commandeStatus.length >= 1) {
      filteredOrders = filteredOrders.filter((order) => {
        if (commandeStatus.length === 0) {
          return true;
        }
        return commandeStatus.includes(String(order.fulfillment_status));;
      });
    }
    setFilteredOrders(filteredOrders);
  }, [orders]);

  const handleCommandeStatusRemove = useCallback(() => {
    setCommandeStatus([]);
    var filteredOrders = orders;
    if (paiementStatus.length >= 1) {
      filteredOrders = filteredOrders.filter((order) => {
        if (paiementStatus.length === 0) {
          return true;
        }
        return paiementStatus.includes(String(order.financial_status));
      });
    }
    setFilteredOrders(filteredOrders);
  }, [orders]);

  const handlePaiementStatusRemove = useCallback(() => {
    setPaiementStatus([]);
    var filteredOrders = orders;
    if (commandeStatus.length >= 1) {
      filteredOrders = filteredOrders.filter((order) => {
        if (commandeStatus.length === 0) {
          return true;
        }
        return commandeStatus.includes(String(order.fulfillment_status));
      });
    }
    setFilteredOrders(filteredOrders);
  }, [orders]);

  const handleCseChange = useCallback(
    (value) => {
      setCse(value);
      const filteredOrders = orders.filter((order) => {
        if (value.length === 0) {
          return true;
        }
        return value.includes(String(order.client.entreprise.code_cse.value));
      });

      setFilteredOrders(filteredOrders);
    },
    [orders, filteredOrders]
  );

  const handleCseRemove = useCallback(() => {
    setCse([]);
    setFilteredOrders(orders);
  }, [orders]);

  const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);

  const handleFiltersClearAll = useCallback(() => {
    handleCommandeStatusRemove();
    handlePaiementStatusRemove();
    handleCseRemove();
    handleQueryValueRemove();
  }, [
    handleCommandeStatusRemove,
    handlePaiementStatusRemove,
    handleCseRemove,
    handleQueryValueRemove,
  ]);

  const filters = [
    {
      key: "paiementStatus",
      label: "Statut du paiement",
      filter: (
        <ChoiceList
          title="Statut du paiement"
          titleHidden
          choices={[
            { label: "Payé", value: "paid" },
            { label: "Partiellement remboursé", value: "partially_refunded" },
            { label: "Partiellement payé", value: "partially_paid" },
            { label: "Remboursé", value: "refunded" },
            { label: "En attente", value: "pending" },
          ]}
          selected={paiementStatus || []}
          onChange={handlePaiementStatusChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "commandeStatus",
      label: "Statut de la commande",
      filter: (
        <ChoiceList
          title="Statut de la commande"
          titleHidden
          choices={[
            { label: "Traitée", value: "fulfilled" },
            { label: "En cours", value: "null" },
            // { label: "Traitement partielle", value: "partial" },
            // { label: "Restockage", value: "restocked" },
          ]}
          selected={commandeStatus || []}
          onChange={handleCommandeStatusChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "cse",
      label: "CSE",
      filter: (
        <ChoiceList
          title="CSE"
          titleHidden
          choices={[
            ...entreprises.map((entreprise) => {
              return {
                label: entreprise.cse_name.value,
                value: entreprise.code_cse.value,
              };
            }),
          ]}
          selected={cse || []}
          onChange={handleCseChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = [];
  if (commandeStatus && !isEmpty(commandeStatus)) {
    const key = "commandeStatus";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, commandeStatus),
      onRemove: handleCommandeStatusRemove,
    });
  }
  if (paiementStatus && !isEmpty(paiementStatus)) {
    const key = "paiementStatus";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, paiementStatus),
      onRemove: handlePaiementStatusRemove,
    });
  }
  if (cse && !isEmpty(cse)) {
    const key = "cse";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, cse),
      onRemove: handleCseRemove,
    });
  }

  function disambiguateLabel(key, value) {
    let entrepriseLabels = {};

    entreprises.forEach((entreprise) => {
      entrepriseLabels[entreprise.code_cse.value] = entreprise.cse_name.value;
    });

    switch (key) {
      case "commandeStatus":
        return value
          .map((val) => {
            switch (val) {
              case "fulfilled":
                return "Traitée";
              case "null":
                return "En cours";
              case "partial":
                return "Traitement partielle";
              case "restocked":
                return "Restockage";
              default:
                return "État inconnu";
            }
          })
          .join(", ");
      case "paiementStatus":
        return value
          .map((val) => {
            switch (val) {
              case "paid":
                return "Payée";
              case "partially_refunded":
                return "Partiellement remboursée";
              case "partially_paid":
                return "Partiellement payée";
              case "refunded":
                return "Remboursée";
              case "pending":
                return "En cours";
              default:
                return "État inconnu";
            }
          })
          .join(", ");
      case "cse":
        return value
          .map((val) => entrepriseLabels[val] || "État inconnu")
          .join(", ");
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === '' || value == null;
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ordersResponse, entreprisesResponse] = await Promise.all([
          fetch("https://staging.api.creuch.fr/api/get_orders", {
            method: "POST",
            headers: {
              "Content-type": "application/json"
            },
          }),
          fetch("https://staging.api.creuch.fr/api/entreprises", {
            method: "GET",
            headers: {
              "Content-type": "application/json",
            },
          }),
        ]);

        const [ordersData, entreprisesData] = await Promise.all([
          ordersResponse.json(),
          entreprisesResponse.json(),
        ]);

        console.log("Orders", ordersData);
        console.log("Entreprises", entreprisesData);

        setOrders(ordersData);
        setFilteredOrders(ordersData);
        setEntreprises(entreprisesData);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Page
      fullWidth
      backAction={{ content: "Tableau de bord", url: "/dashboard" }}
      title="Commandes"
      titleMetadata={<Badge status="success">{orders.length} Commandes</Badge>}
      subtitle="Gérez les commandes de votre CSE"
      compactTitle
      primaryAction={{
        content: (
          <div style={{ display: "flex" }}>
            <Icon source={ExportMinor} color="base" /> Exporter
          </div>
        ),
        onAction: exportToExcel,
      }}
    >
      <div>
        <Modal open={isLoading} loading small></Modal>
      </div>
      <Layout>
        <Layout.Section>
          <LegacyCard>
            <IndexFilters
              sortOptions={sortOptions}
              sortSelected={sortSelected}
              onSort={handleSortSelected}
              queryValue={queryValue}
              queryPlaceholder="Recherchez dans tout les champs ..."
              onQueryChange={handleFiltersQueryChange}
              onQueryClear={handleFiltersQueryClear}
              primaryAction={primaryAction}
              cancelAction={{
                onAction: onHandleCancel,
                disabled: false,
                loading: false,
              }}
              tabs={tabs}
              selected={selected}
              onSelect={setSelected}
              canCreateNewView
              onCreateNewView={onCreateNewView}
              filters={filters}
              appliedFilters={appliedFilters}
              onClearAll={handleFiltersClearAll}
              mode={mode}
              setMode={setMode}
            />
            <IndexTable
              resourceName={resourceName}
              itemCount={filteredOrders.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              emptyState={emptyStateMarkup}
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Commande" },
                { title: "Date" },
                { title: "Client" },
                { title: "Abondements" },
                { title: "Total", alignment: "end" },
                { title: "Statut du paiement" },
                { title: "Statut des commandes" },
              ]}
              bulkActions={bulkActions}
              onNavigation
              selectable
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}