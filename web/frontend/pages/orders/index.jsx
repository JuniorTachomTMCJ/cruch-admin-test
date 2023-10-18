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
  Popover,
  HorizontalGrid,
  Scrollable,
  OptionList,
  VerticalStack,
  HorizontalStack,
  TextField,
  DatePicker,
  
} from "@shopify/polaris";
import {
  ImageMajor,
  ExportMinor,
  CalendarMinor,
  ArrowRightMinor,
} from "@shopify/polaris-icons";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [commandeStatus, setCommandeStatus] = useState([]);
  const [paiementStatus, setPaiementStatus] = useState([]);
  const [queryValue, setQueryValue] = useState("");

  const mdDown = false;
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const yesterday = new Date(
    new Date(new Date().setDate(today.getDate() - 1)).setHours(0, 0, 0, 0)
  );
  const ranges = [
    {
      title: "Aujourd'hui",
      alias: "today",
      period: {
        since: today,
        until: today,
      },
    },
    {
      title: "Hier",
      alias: "yesterday",
      period: {
        since: yesterday,
        until: yesterday,
      },
    },
    {
      title: "7 derniers jours",
      alias: "last7days",
      period: {
        since: new Date(
          new Date(new Date().setDate(today.getDate() - 7)).setHours(0, 0, 0, 0)
        ),
        until: yesterday,
      },
    },
    {
      title: "Ce mois-ci",
      alias: "this_month",
      period: {
        since: new Date(today.getFullYear(), today.getMonth(), 1),
        until: today,
      },
    },
    {
      title: "Cette année",
      alias: "this_year",
      period: {
        since: new Date(today.getFullYear(), 0, 1),
        until: today,
      },
    },
  ];
  const [popoverActive, setPopoverActive] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState(ranges[0]);
  const [inputValues, setInputValues] = useState({});
  const [{ month, year }, setDate] = useState({
    month: activeDateRange.period.since.getMonth(),
    year: activeDateRange.period.since.getFullYear(),
  });
  const datePickerRef = useRef(null);
  const VALID_YYYY_MM_DD_DATE_REGEX = /^\d{4}-\d{1,2}-\d{1,2}/;
  
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
          <Badge progress="complete" status="success">
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

  const rowMarkup = filteredOrders.map((order, index) => {
    let totalGiftCardAmount = 0;

    order.transactions.forEach((transaction) => {
      if (
        transaction.gateway === "gift_card" &&
        transaction.status === "success"
      ) {
        totalGiftCardAmount += parseFloat(transaction.amount);
      }
    });

    return (
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
        <IndexTable.Cell>
          {`${totalGiftCardAmount} €`}
        </IndexTable.Cell>
        <IndexTable.Cell>{`${order.total_price} €`}</IndexTable.Cell>
        <IndexTable.Cell>
          {financialStatusBadge(order.financial_status)}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {fulfillmentStatusBadge(order.fulfillment_status)} {" "}
          {order.cancelled_at ? (<Badge progress="complete" status="fulfilled">Annulée</Badge>) : ""} {" "}
          {order.metafields[1]?.value ? (<Badge progress="complete" status="critical">Supprimée</Badge>) : ""}
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const exportToExcel = async () => {
    const tableau = filteredOrders.map((order, index) => {
      const status = order.financial_status;
      const status_order = order.fulfillment_status;
      const isCancelled = order.cancelled_at !== null;
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
          (status_order === "fulfilled"
            ? "Traitée"
            : status_order === null
            ? "En cours"
            : status_order === "partial"
            ? "Traitement partielle"
            : status_order === "restocked"
            ? "Restockage"
            : "État inconnu") + (isCancelled ? ", Annulée" : ""),
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
    setCommandeStatus([]);
    setPaiementStatus([]);
    let orders_temp = [];
    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
        orders_temp.push(order);
      }
    });
    setFilteredOrders(orders_temp);
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
  
  
  const handleCommandeStatusChange = useCallback(
    (value) => {
      setCommandeStatus(value);
      const updatedFilteredOrders = orders.filter((order) => {
        if (value.length === 0) {
          return true;
        }
        return value == "cancel" ? order.cancelled_at != null : value.includes(String(order.fulfillment_status));
      });
      let orders_temp = [];
      updatedFilteredOrders.forEach((order) => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
          orders_temp.push(order);
        }
      });
      setFilteredOrders(orders_temp);
    },
    [orders, activeDateRange]
  );

  const handlePaiementStatusChange = useCallback(
    (value) => {
      setPaiementStatus(value);
      const updatedFilteredOrders = orders.filter((order) => {
        if (value.length === 0) {
          return true;
        }
        return value.includes(String(order.financial_status));
      });
      let orders_temp = [];
      updatedFilteredOrders.forEach((order) => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
          orders_temp.push(order);
        }
      });
      setFilteredOrders(orders_temp);
    },
    [orders, activeDateRange]
  );

  const handleCseChange = useCallback(
    (value) => {
      setCse(value);
      const updatedFilteredOrders = orders.filter((order) => {
        if (value.length === 0) {
          return true;
        }
        return value.includes(String(order.client.entreprise.code_cse.value));
      });
      let orders_temp = [];
      updatedFilteredOrders.forEach((order) => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
          orders_temp.push(order);
        }
      });
      setFilteredOrders(orders_temp);
    },
    [orders, activeDateRange]
  );

  const handleFiltersQueryChange = useCallback(
    (value) => {
      setQueryValue(value);
      const searchValueLower = value.toLowerCase();
      if (searchValueLower === "") {
        setFilteredOrders(filteredOrders);
      } else {
        const updatedFilteredOrders = filteredOrders.filter(
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
        setFilteredOrders(updatedFilteredOrders);
      }
    },
    [filteredOrders]
  );

  const handleFiltersQueryClear = useCallback(() => {
    setQueryValue("");
    const updatedFilteredOrders = orders;
    if (paiementStatus.length >= 1) {
      updatedFilteredOrders = updatedFilteredOrders.filter((order) => {
        if (paiementStatus.length === 0) {
          return true;
        }
        return paiementStatus.includes(String(order.financial_status));
      });
    }
    if (commandeStatus.length >= 1) {
      updatedFilteredOrders = updatedFilteredOrders.filter((order) => {
        if (commandeStatus.length === 0) {
          return true;
        }
        return commandeStatus.includes(String(order.fulfillment_status));
      });
    }
    let orders_temp = [];
    updatedFilteredOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
        orders_temp.push(order);
      }
    });
    setFilteredOrders(orders_temp);
  }, [orders, activeDateRange]);

  const handleCommandeStatusRemove = useCallback(() => {
    setCommandeStatus([]);
    var updatedFilteredOrders = orders;
    if (paiementStatus.length >= 1) {
      updatedFilteredOrders = updatedFilteredOrders.filter((order) => {
        if (paiementStatus.length === 0) {
          return true;
        }
        return paiementStatus.includes(String(order.financial_status));
      });
    }
    let orders_temp = [];
    updatedFilteredOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
        orders_temp.push(order);
      }
    });
    setFilteredOrders(orders_temp);
  }, [orders, activeDateRange]);

  const handlePaiementStatusRemove = useCallback(() => {
    setPaiementStatus([]);
    var updatedFilteredOrders = orders;
    if (commandeStatus.length >= 1) {
      updatedFilteredOrders = updatedFilteredOrders.filter((order) => {
        if (commandeStatus.length === 0) {
          return true;
        }
        return commandeStatus.includes(String(order.fulfillment_status));
      });
    }
    let orders_temp = [];
    updatedFilteredOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
        orders_temp.push(order);
      }
    });
    setFilteredOrders(orders_temp);
  }, [orders, activeDateRange]);

  const handleCseRemove = useCallback(() => {
    setCse([]);
    let orders_temp = [];
    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
        orders_temp.push(order);
      }
    });
    setFilteredOrders(orders_temp);
  }, [orders]);

  const handleQueryValueRemove = useCallback(() => {
    setQueryValue("");
    let orders_temp = [];
    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
        orders_temp.push(order);
      }
    });
    setFilteredOrders(orders_temp);
  }, [orders]);

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
            { label: "Annulé", value: "cancel" },
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
              case "cancel":
                return "Annulé";
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

  function isDate(date) {
    return !isNaN(new Date(date).getDate());
  }
  function isValidYearMonthDayDateString(date) {
    return VALID_YYYY_MM_DD_DATE_REGEX.test(date) && isDate(date);
  }
  function isValidDate(date) {
    return date.length === 10 && isValidYearMonthDayDateString(date);
  }
  function parseYearMonthDayDateString(input) {
    // Date-only strings (e.g. "1970-01-01") are treated as UTC, not local time
    // when using new Date()
    // We need to split year, month, day to pass into new Date() separately
    // to get a localized Date
    const [year, month, day] = input.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  function formatDateToYearMonthDayDateString(date) {
    const year = String(date.getFullYear());
    let month = String(date.getMonth() + 1);
    let day = String(date.getDate());
    if (month.length < 2) {
      month = String(month).padStart(2, "0");
    }
    if (day.length < 2) {
      day = String(day).padStart(2, "0");
    }
    return [year, month, day].join("-");
  }
  function formatDate(date) {
    return formatDateToYearMonthDayDateString(date);
  }
  function nodeContainsDescendant(rootNode, descendant) {
    if (rootNode === descendant) {
      return true;
    }
    let parent = descendant.parentNode;
    while (parent != null) {
      if (parent === rootNode) {
        return true;
      }
      parent = parent.parentNode;
    }
    return false;
  }
  function isNodeWithinPopover(node) {
    return datePickerRef?.current
      ? nodeContainsDescendant(datePickerRef.current, node)
      : false;
  }
  function handleStartInputValueChange(value) {
    setInputValues((prevState) => {
      return { ...prevState, since: value };
    });
    if (isValidDate(value)) {
      const newSince = parseYearMonthDayDateString(value);
      setActiveDateRange((prevState) => {
        const newPeriod =
          prevState.period && newSince <= prevState.period.until
            ? { since: newSince, until: prevState.period.until }
            : { since: newSince, until: newSince };
        return {
          ...prevState,
          period: newPeriod,
        };
      });
    }
  }
  function handleEndInputValueChange(value) {
    setInputValues((prevState) => ({ ...prevState, until: value }));
    if (isValidDate(value)) {
      const newUntil = parseYearMonthDayDateString(value);
      setActiveDateRange((prevState) => {
        const newPeriod =
          prevState.period && newUntil >= prevState.period.since
            ? { since: prevState.period.since, until: newUntil }
            : { since: newUntil, until: newUntil };
        return {
          ...prevState,
          period: newPeriod,
        };
      });
    }
  }
  function handleInputBlur({ relatedTarget }) {
    const isRelatedTargetWithinPopover =
      relatedTarget != null && isNodeWithinPopover(relatedTarget);
    // If focus moves from the TextField to the Popover
    // we don't want to close the popover
    if (isRelatedTargetWithinPopover) {
      return;
    }
    setPopoverActive(false);
  }
  function handleMonthChange(month, year) {
    setDate({ month, year });
  }
  function handleCalendarChange({ start, end }) {
    const newDateRange = ranges.find((range) => {
      return (
        range.period.since.valueOf() === start.valueOf() &&
        range.period.until.valueOf() === end.valueOf()
      );
    }) || {
      alias: "custom",
      title: "Custom",
      period: {
        since: start,
        until: end,
      },
    };
    setActiveDateRange(newDateRange);
  }
  function apply() {
    setPopoverActive(false);
    let orders_temp = [];
    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= activeDateRange.period.since && orderDate < activeDateRange.period.until) {
        orders_temp.push(order);
      }
    });
    setFilteredOrders(orders_temp);
  }
  function cancel() {
    setPopoverActive(false);
  }

  useEffect(() => {
    if (activeDateRange) {
      setInputValues({
        since: formatDate(activeDateRange.period.since),
        until: formatDate(activeDateRange.period.until),
      });
      function monthDiff(referenceDate, newDate) {
        return (
          newDate.month -
          referenceDate.month +
          12 * (referenceDate.year - newDate.year)
        );
      }
      const monthDifference = monthDiff(
        { year, month },
        {
          year: activeDateRange.period.until.getFullYear(),
          month: activeDateRange.period.until.getMonth(),
        }
      );
      if (monthDifference > 1 || monthDifference < 0) {
        setDate({
          month: activeDateRange.period.until.getMonth(),
          year: activeDateRange.period.until.getFullYear(),
        });
      }
    }
  }, [activeDateRange]);
  const buttonValue =
    activeDateRange.title === "Custom"
      ? activeDateRange.period.since.toDateString() +
        " - " +
        activeDateRange.period.until.toDateString()
      : activeDateRange.title;

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
        setEntreprises(entreprisesData);
        let orders_temp = [];
        ordersData.forEach((orderData) => {
          const orderDate = new Date(orderData.created_at);
          if (
            orderDate >= activeDateRange.period.since &&
            orderDate < activeDateRange.period.until
          ) {
            orders_temp.push(orderData);
          }
        });
        setFilteredOrders(orders_temp);
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
      backAction={{ content: "Tableau de bord", url: "/" }}
      title="Commandes"
      titleMetadata={
        <Badge status="success">{filteredOrders.length} Commandes</Badge>
      }
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
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}>
              <Popover
                active={popoverActive}
                autofocusTarget="none"
                preferredAlignment="left"
                preferredPosition="below"
                fluidContent
                sectioned={false}
                fullHeight
                activator={
                  <Button
                    size="slim"
                    icon={CalendarMinor}
                    onClick={() => setPopoverActive(!popoverActive)}
                  >
                    {buttonValue}
                  </Button>
                }
                onClose={() => setPopoverActive(false)}
              >
                <Popover.Pane fixed>
                  <HorizontalGrid
                    columns={{
                      xs: "1fr",
                      mdDown: "1fr",
                      md: "max-content max-content",
                    }}
                    gap={0}
                    // ref={datePickerRef}
                  >
                    <Box
                      maxWidth={mdDown ? "516px" : "212px"}
                      width={mdDown ? "100%" : "212px"}
                      padding={{ xs: 500, md: 0 }}
                      paddingBlockEnd={{ xs: 100, md: 0 }}
                    >
                      {mdDown ? (
                        <Select
                          label="dateRangeLabel"
                          labelHidden
                          onChange={(value) => {
                            const result = ranges.find(
                              ({ title, alias }) =>
                                title === value || alias === value
                            );
                            setActiveDateRange(result);
                          }}
                          value={
                            activeDateRange?.title ||
                            activeDateRange?.alias ||
                            ""
                          }
                          options={ranges.map(
                            ({ alias, title }) => title || alias
                          )}
                        />
                      ) : (
                        <Scrollable style={{ height: "334px" }}>
                          <OptionList
                            options={ranges.map((range) => ({
                              value: range.alias,
                              label: range.title,
                            }))}
                            selected={activeDateRange.alias}
                            onChange={(value) => {
                              setActiveDateRange(
                                ranges.find((range) => range.alias === value[0])
                              );
                            }}
                          />
                        </Scrollable>
                      )}
                    </Box>
                    <Box
                      padding={{ xs: 500 }}
                      maxWidth={mdDown ? "320px" : "516px"}
                    >
                      <VerticalStack gap="400">
                        <HorizontalStack gap="200">
                          <div style={{ flexGrow: 1 }}>
                            <TextField
                              role="combobox"
                              label={"Since"}
                              labelHidden
                              prefix={<Icon source={CalendarMinor} />}
                              value={inputValues.since}
                              onChange={handleStartInputValueChange}
                              onBlur={handleInputBlur}
                              autoComplete="off"
                            />
                          </div>
                          <Icon source={ArrowRightMinor} />
                          <div style={{ flexGrow: 1 }}>
                            <TextField
                              role="combobox"
                              label={"Until"}
                              labelHidden
                              prefix={<Icon source={CalendarMinor} />}
                              value={inputValues.until}
                              onChange={handleEndInputValueChange}
                              onBlur={handleInputBlur}
                              autoComplete="off"
                            />
                          </div>
                        </HorizontalStack>
                        <div>
                          <DatePicker
                            month={month}
                            year={year}
                            selected={{
                              start: activeDateRange.period.since,
                              end: activeDateRange.period.until,
                            }}
                            onMonthChange={handleMonthChange}
                            onChange={handleCalendarChange}
                            multiMonth
                            allowRange
                          />
                        </div>
                      </VerticalStack>
                    </Box>
                  </HorizontalGrid>
                </Popover.Pane>
                <Popover.Pane fixed>
                  <Popover.Section>
                    <HorizontalStack align="end">
                      <div style={{ marginRight: "10px" }}>
                        <Button onClick={cancel}>Annuler</Button>
                      </div>
                      <Button primary onClick={apply}>
                        Appliquer
                      </Button>
                    </HorizontalStack>
                  </Popover.Section>
                </Popover.Pane>
              </Popover>
            </Grid.Cell>
          </Grid>
        </Layout.Section>
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