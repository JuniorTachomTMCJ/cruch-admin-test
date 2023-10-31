import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Page,
  Layout,
  Text,
  Grid,
  LegacyCard,
  Divider,
  VerticalStack,
  Loading,
  Frame,
  Select,
  Thumbnail,
  Popover,
  TextField,
  DatePicker,
  Icon,
  Button,
  HorizontalGrid,
  Box,
  Scrollable,
  OptionList,
  HorizontalStack,
  Checkbox,
  Modal,
  Collapsible,
} from "@shopify/polaris";
import {
  PolarisVizProvider,
  BarChart
} from "@shopify/polaris-viz";
import {
  CalendarMinor,
  ImageMajor,
  ArrowRightMinor,
  CollectionsMajor,
  ProductsMajor,
  ExportMinor,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import "@shopify/polaris-viz/build/esm/styles.css";
import { utils, writeFileXLSX } from "xlsx";
export { utils, writeFileXLSX };

export default function DashboardPage() {
  const app = useAppBridge();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    "sales": [],
    "total_sales": 0,
    "total_reductions": 0,
    "total_orders_count": 0,
    "total_reductions_price": 0,
    "total_reductions_count": 0,
    "count_reductions_use": 0,
    "count_salarie_register": 0
  });
  const [collections, setCollections] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reductions, setReductions] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [selectedEntreprises, setSelectedEntreprises] = useState([]);

  const mdDown = false;
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const yesterday = new Date(
    new Date(new Date().setDate(today.getDate() - 1)).setHours(0, 0, 0, 0)
  );
  function setEndOfDay(date) {
    return new Date(new Date(date).setHours(23, 59, 59, 999));
  }
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
    const stats = getAllStatistics(
      selectedCollections,
      selectedEntreprises,
      activeDateRange.period.since,
      setEndOfDay(activeDateRange.period.until),
      collections,
      entreprises,
      orders,
      reductions,
      customers
    );
    setStats(stats);
  }
  function cancel() {
    setPopoverActive(false);
  }
  
  function getAllStatistics(
    collectionsIds,
    entreprisesIds,
    startDate,
    endDate,
    collections = [],
    entreprises = [],
    orders = [],
    reductions = [],
    customers = []
  ) {
    const datas = {};
    let total_reductions = 0;
    let total_sales = 0;
    let total_orders_count = 0;
    let total_reductions_count = 0;
    let total_reductions_price = 0;
    let count_reductions_use = 0;
    let count_salarie_register = 0;

    // const dateRange = getDateRange(startDate, endDate);
    // dateRange.forEach((date) => {
    //   datas[date.toISOString().slice(0, 10)] = 0;
    // });

    // Graphe Calcule
    if (entreprisesIds.length === 0) {
      entreprises.forEach((entreprise) => {
        if (collectionsIds.length === 0) {
          collections.forEach((collection) => {
            orders.forEach((order) => {
              const orderDate = new Date(order.created_at);
              const metafield = order.metafields.find(
                (metafield) => metafield.key === "deleted"
              );
              order.line_items.forEach((product) => {
                let productsIds = collection.products.map(
                  (produit) => produit.id.match(/\/(\d+)$/)[1]
                );
                if (
                  productsIds.includes(String(product.product_id)) &&
                  orderDate >= startDate &&
                  orderDate < endDate &&
                  order.client.entreprise?.code_cse.value ==
                    entreprise.code_cse.value &&
                  metafield.value == false
                ) {
                  const formattedDate = orderDate.toISOString().slice(0, 10);
                  if (!datas[formattedDate]) {
                    datas[formattedDate] = 1;
                  } else {
                    datas[formattedDate]++;
                  }
                }
              });
            });
          });
        } else {
          collectionsIds.forEach((collectionId) => {
            const collection = collections.find(
              (collection) => collection.id === collectionId
            );
            if (collection) {
              orders.forEach((order) => {
                const orderDate = new Date(order.created_at);
                const metafield = order.metafields.find(
                  (metafield) => metafield.key === "deleted"
                );
                order.line_items.forEach((product) => {
                  let productsIds = collection.products.map(
                    (produit) => produit.id.match(/\/(\d+)$/)[1]
                  );
                  if (
                    productsIds.includes(String(product.product_id)) &&
                    orderDate >= startDate &&
                    orderDate < endDate &&
                    order.client.entreprise?.code_cse.value ==
                      entreprise.code_cse.value &&
                    metafield.value == false
                  ) {
                    const formattedDate = orderDate.toISOString().slice(0, 10);
                    if (!datas[formattedDate]) {
                      datas[formattedDate] = 1;
                    } else {
                      datas[formattedDate]++;
                    }
                  }
                });
              });
            } else {
              const productId = collectionId;
              orders.forEach((order) => {
                const orderDate = new Date(order.created_at);
                const metafield = order.metafields.find(
                  (metafield) => metafield.key === "deleted"
                );
                order.line_items.forEach((product) => {
                  if (
                    String(productId.match(/\/(\d+)$/)[1]) == String(product.product_id) &&
                    orderDate >= startDate &&
                    orderDate < endDate &&
                    order.client.entreprise?.code_cse.value ==
                      entreprise.code_cse.value &&
                    metafield.value == false
                  ) {
                    const formattedDate = orderDate.toISOString().slice(0, 10);
                    if (!datas[formattedDate]) {
                      datas[formattedDate] = 1;
                    } else {
                      datas[formattedDate]++;
                    }
                  }
                });
              });
            }
          });
        }
      });
    } else {
      entreprisesIds.forEach((entrepriseId) => {
        const entreprise = entreprises.find(
          (entreprise) => entreprise.code_cse.value === entrepriseId
        );

        if (collectionsIds.length === 0) {
          collections.forEach((collection) => {
            orders.forEach((order) => {
              const orderDate = new Date(order.created_at);
              const metafield = order.metafields.find(
                (metafield) => metafield.key === "deleted"
              );
              order.line_items.forEach((product) => {
                let productsIds = collection.products.map(
                  (produit) => produit.id.match(/\/(\d+)$/)[1]
                );
                if (
                  productsIds.includes(String(product.product_id)) &&
                  orderDate >= startDate &&
                  orderDate < endDate &&
                  order.client.entreprise?.code_cse.value ==
                    entreprise.code_cse.value &&
                  metafield.value == false
                ) {
                  const formattedDate = orderDate.toISOString().slice(0, 10);
                  if (!datas[formattedDate]) {
                    datas[formattedDate] = 1;
                  } else {
                    datas[formattedDate]++;
                  }
                }
              });
            });
          });
        } else {
          collectionsIds.forEach((collectionId) => {
            const collection = collections.find(
              (collection) => collection.id === collectionId
            );
            if (collection) {
              orders.forEach((order) => {
                const orderDate = new Date(order.created_at);
                const metafield = order.metafields.find(
                  (metafield) => metafield.key === "deleted"
                );
                order.line_items.forEach((product) => {
                  let productsIds = collection.products.map(
                    (produit) => produit.id.match(/\/(\d+)$/)[1]
                  );
                  if (
                    productsIds.includes(String(product.product_id)) &&
                    orderDate >= startDate &&
                    orderDate < endDate &&
                    order.client.entreprise?.code_cse.value ==
                      entreprise.code_cse.value &&
                    metafield.value == false
                  ) {
                    const formattedDate = orderDate.toISOString().slice(0, 10);
                    if (!datas[formattedDate]) {
                      datas[formattedDate] = 1;
                    } else {
                      datas[formattedDate]++;
                    }
                  }
                });
              });
            } else {
              const productId = collectionId;
              orders.forEach((order) => {
                const orderDate = new Date(order.created_at);
                const metafield = order.metafields.find(
                  (metafield) => metafield.key === "deleted"
                );
                order.line_items.forEach((product) => {
                  if (
                    String(productId.match(/\/(\d+)$/)[1]) ==
                      String(product.product_id) &&
                    orderDate >= startDate &&
                    orderDate < endDate &&
                    order.client.entreprise?.code_cse.value ==
                      entreprise.code_cse.value &&
                    metafield.value == false
                  ) {
                    const formattedDate = orderDate.toISOString().slice(0, 10);
                    if (!datas[formattedDate]) {
                      datas[formattedDate] = 1;
                    } else {
                      datas[formattedDate]++;
                    }
                  }
                });
              });
            }
          });
        }
      });
    }

    const transformedData = Object.keys(datas).map((date, index) => ({key: date, value: datas[date]}));
    transformedData.sort((a, b) => new Date(a.key) - new Date(b.key));

    // Commandes stat global
    if (entreprisesIds.length === 0) {
      entreprises.forEach((entreprise) => {
        orders.forEach((order) => {
          const orderDate = new Date(order.created_at);
          const metafield = order.metafields.find(
            (metafield) => metafield.key === "deleted"
          );
          if (
            orderDate >= startDate &&
            orderDate < endDate &&
            order.client.entreprise?.code_cse.value == entreprise.code_cse.value &&
            metafield.value == false
          ) {
            total_orders_count++;
            order.transactions.forEach((transaction) => {
              if (
                transaction.gateway == "gift_card" &&
                transaction.status == "success" &&
                transaction.kind == "sale"
              ) {
                total_reductions += parseFloat(transaction.amount);
                count_reductions_use++;
              }
            });
            total_sales += parseFloat(order.total_price);
          }
        });

        customers.forEach((customer) => {
          const customerDate = new Date(customer.createdAt);
          const metafield = customer.metafields.find((metafield) => metafield.key === "code_cse");
          if (customerDate >= startDate && customerDate < endDate && metafield.value == entreprise.code_cse.value) {
            count_salarie_register++;
          }
        });
      });
    } else {
      entreprisesIds.forEach((entrepriseId) => {
        const entreprise = entreprises.find(
          (entreprise) => entreprise.code_cse.value === entrepriseId
        );

        orders.forEach((order) => {
          const orderDate = new Date(order.created_at);
          const metafield = order.metafields.find(
            (metafield) => metafield.key === "deleted"
          );
          if (
            orderDate >= startDate &&
            orderDate < endDate &&
            order.client.entreprise?.code_cse.value == entreprise.code_cse.value &&
            metafield.value == false
          ) {
            total_orders_count++;
            order.transactions.forEach((transaction) => {
              if (
                transaction.gateway == "gift_card" &&
                transaction.status == "success" &&
                transaction.kind == "sale"
              ) {
                total_reductions += parseFloat(transaction.amount);
                count_reductions_use++;
              }
            });
            total_sales += parseFloat(order.total_price);
          }
        });

        customers.forEach((customer) => {
          const customerDate = new Date(customer.createdAt);
          const metafield = customer.metafields.find((metafield) => metafield.key === "code_cse");
          if (customerDate >= startDate && customerDate < endDate && metafield.value == entreprise.code_cse.value) {
            count_salarie_register++;
          }
        });
      });
    }

    reductions.forEach((reduction) => {
      const reductionDate = new Date(reduction.created_at);
      if (
        reductionDate >= startDate &&
        reductionDate < endDate &&
        reduction.disabled_at == null
      ) {
        total_reductions_price += parseFloat(reduction.initial_value);
        total_reductions_count++;
      }
    });

    return {
      sales: transformedData,
      total_sales: parseFloat(total_sales).toFixed(2),
      total_reductions: parseFloat(total_reductions).toFixed(2),
      total_orders_count: total_orders_count,
      total_reductions_price: parseFloat(total_reductions_price).toFixed(2),
      total_reductions_count: total_reductions_count,
      count_reductions_use: count_reductions_use,
      count_salarie_register: count_salarie_register,
    };
  }

  function getDateRange(startDate, endDate) {
    const dateRange = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateRange;
  }

  const handleSelectionCollections = useCallback((parentId) => {
    if (parentId === 1) {
      setSelectedCollections([]);
    } else {
      if (selectedCollections.includes(parentId)) {
        setSelectedCollections(selectedCollections.filter((id) => id !== parentId));
      } else {
        setSelectedCollections([...selectedCollections, parentId]);
      }
    }
  }, [selectedCollections]);

  const handleSelectionEntreprises = useCallback(
    (parentId) => {
      if (parentId === 1) {
        setSelectedEntreprises([]);
      } else {
        if (selectedEntreprises.includes(parentId)) {
          setSelectedEntreprises(
            selectedEntreprises.filter((id) => id !== parentId)
          ); // Désélectionne l'élément
        } else {
          setSelectedEntreprises([...selectedEntreprises, parentId]); // Sélectionne l'élément
        }
      }
    },
    [selectedEntreprises]
  );

  const renderSubcategories = (parentId) => {
    const parentCollection = collections.find(
      (collection) => collection.id === parentId
    );

    if (parentCollection == undefined ||
      (parentCollection.sub_collections.length === 0 &&
      parentCollection.products.length === 0)
    ) {
      return null;
    }

    return (
      (parentCollection.sub_collections.length > 0 ||
        parentCollection.products.length > 0) && (
        <div style={{ marginLeft: "40px" }}>
          <Collapsible
            open={selectedCollections.includes(parentId)}
            id={parentId}
            transition={{ duration: "150ms", timingFunction: "ease" }}
            expandOnPrint
          >
            {parentCollection.sub_collections.map((sub_collection) => (
              <VerticalStack key={sub_collection.handle}>
                <Checkbox
                  label={
                    <>
                      <div style={{ display: "flex" }}>
                        <Icon
                          source={CollectionsMajor}
                          accessibilityLabel="Collection"
                          color="highlight"
                        />{" "}
                        {sub_collection.title.length > 25
                          ? `${sub_collection.title.substring(0, 25)}...`
                          : sub_collection.title}{" "}
                        {sub_collection.sub_collections.length === 0 ||
                        sub_collection.products.length === 0
                          ? "(0)"
                          : ""}
                      </div>
                    </>
                  }
                  checked={selectedCollections.includes(sub_collection.id)}
                  onChange={() => handleSelectionCollections(sub_collection.id)}
                />
                {renderSubcategories(sub_collection.id)}
              </VerticalStack>
            ))}
            {parentCollection.sub_collections.length >= 1 &&
              parentCollection.products.length >= 1 && <Divider />}
            {parentCollection.products.map((product) => (
              <VerticalStack key={product.id}>
                <Checkbox
                  label={
                    <>
                      <div style={{ display: "flex" }}>
                        <Icon
                          source={ProductsMajor}
                          accessibilityLabel="Produit"
                          color="success"
                        />{" "}
                        {product.title.length > 25
                          ? `${product.title.substring(0, 25)}...`
                          : product.title}
                      </div>
                    </>
                  }
                  checked={selectedCollections.includes(product.id)}
                  onChange={() => handleSelectionCollections(product.id)}
                />
              </VerticalStack>
            ))}
          </Collapsible>
        </div>
      )
    );
  };

  const exportToExcel = async () => {
    const tableau = [
      {
        "Total de commandes": stats.total_orders_count,
        "Chiffre d'affaire global": stats.total_sales + " €",
        "Chiffre d'affaire abondement": stats.total_reductions + " €",
        "Chiffre d'affaire hors abondements":
          parseFloat(stats.total_sales - stats.total_reductions).toFixed(2) +
          " €",
        "Total des abondements": stats.total_reductions_count,
        "Montant global": stats.total_reductions_price + " €",
        "Chiffre d'affaire des abondements utilisés":
          stats.total_reductions + " €",
        "Total des abondements utilisés": stats.count_reductions_use,
        Offres: collections.length,
        "Nombre d'inscrits": stats.count_salarie_register,
        "Points de retraits": locations.length,
      },
    ];
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(tableau);
    utils.book_append_sheet(
      wb,
      ws,
      "Stats " +
        formatDateToYearMonthDayDateString(activeDateRange.period.since) +
        " - " +
        formatDateToYearMonthDayDateString(activeDateRange.period.until)
    );
    writeFileXLSX(wb, "Statistiques.xlsx");
  };

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
      const stats = getAllStatistics(
        selectedCollections,
        selectedEntreprises,
        activeDateRange.period.since,
        setEndOfDay(activeDateRange.period.until),
        collections,
        entreprises,
        orders,
        reductions,
        customers
      );
      setStats(stats);
    }
  }, [
    selectedCollections,
    selectedEntreprises,
    activeDateRange,
    collections,
    entreprises,
    orders,
    reductions,
    customers,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const statsResponse = await fetch(
          `https://staging.api.creuch.fr/api/statistics`,
          {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
          }
        );
        const data = await statsResponse.json();
        console.log(data);
        setCollections(data["collections"]);
        setEntreprises(data["entreprises"]);
        setCustomers(data["customers"]);
        setLocations(data["locations"]);
        setOrders(data["orders"]);
        setReductions(data["reductions"]);

        const stats = getAllStatistics(
          selectedCollections,
          selectedEntreprises,
          activeDateRange.period.since,
          setEndOfDay(activeDateRange.period.until),
          collections,
          entreprises,
          orders,
          reductions,
          customers
        );
        setStats(stats);
      } catch (error) {
        console.error(
          "Erreur de chargement des statistiques globales :",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ height: "100px" }}>
        <Frame>
          <Loading />
        </Frame>
      </div>
    );
  }

  return (
    <Page
      fullWidth
      title="Tableau de bord"
      subtitle="Creuch Admin"
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
                    {activeDateRange.title === "Custom"
                      ? activeDateRange.period.since.toDateString() +
                        " - " +
                        activeDateRange.period.until.toDateString()
                      : activeDateRange.title}
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
                            allowRange={true}
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

            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 2, lg: 4, xl: 4 }}>
              <LegacyCard title="Commandes" sectioned>
                <VerticalStack gap="3">
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Total de commandes : {stats.total_orders_count}
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Chiffre d'affaire global : {stats.total_sales} €
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Chiffre d'affaire abondement : {stats.total_reductions} €
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Chiffre d'affaire hors abondements :{" "}
                    {parseFloat(
                      stats.total_sales - stats.total_reductions
                    ).toFixed(2)}{" "}
                    €
                  </Text>
                </VerticalStack>
              </LegacyCard>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 2, lg: 4, xl: 4 }}>
              <LegacyCard title="Abondements" sectioned>
                <VerticalStack gap="3">
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Total des abondements : {stats.total_reductions_count}
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Montant global : {stats.total_reductions_price} €
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Total des abondements utilisés : {stats.total_reductions} €
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Nombre des abondements utilisés :{" "}
                    {stats.count_reductions_use}
                  </Text>
                </VerticalStack>
              </LegacyCard>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 2, lg: 4, xl: 4 }}>
              <LegacyCard title="Autres" sectioned>
                <VerticalStack gap="3">
                  <Divider borderColor="border" />
                  <Text as="h1">Offres : {collections.length} </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">
                    Nombre d'inscrits : {stats.count_salarie_register}{" "}
                  </Text>
                  <Divider borderColor="border" />
                  <Text as="h1">Points de retraits : {locations.length} </Text>
                </VerticalStack>
              </LegacyCard>
            </Grid.Cell>
          </Grid>
        </Layout.Section>
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 6, xl: 6 }}>
              <LegacyCard title="Offres et Sous-offres">
                <LegacyCard.Section>
                  {collections.length > 0 ? (
                    <VerticalStack>
                      <VerticalStack key="1">
                        <Checkbox
                          label={
                            <>
                              <div style={{ display: "flex" }}>
                                <Icon
                                  source={CollectionsMajor}
                                  accessibilityLabel="Collection"
                                  color="highlight"
                                />{" "}
                                TOUTES LES OFFRES
                              </div>
                            </>
                          }
                          checked={selectedCollections.length === 0}
                          onChange={() => handleSelectionCollections(1)} // Désélectionne tout
                        />
                      </VerticalStack>
                      {collections
                        .filter((collection) => {
                          let foundEmptyParent = false;

                          collection.metafields.forEach((metafield) => {
                            if (metafield.key === "parent") {
                              foundEmptyParent = true;
                            }
                          });

                          return foundEmptyParent == false;
                        })
                        .map(
                          (collection) =>
                            (collection.sub_collections.length >= 1 ||
                              collection.products.length >= 1) && (
                              <VerticalStack key={collection.id}>
                                <Checkbox
                                  label={
                                    <>
                                      <div style={{ display: "flex" }}>
                                        <Icon
                                          source={CollectionsMajor}
                                          accessibilityLabel="Collection"
                                          color="highlight"
                                        />{" "}
                                        {collection.title}
                                      </div>
                                    </>
                                  }
                                  checked={selectedCollections.includes(
                                    collection.id
                                  )}
                                  onChange={() =>
                                    handleSelectionCollections(collection.id)
                                  }
                                />
                                {renderSubcategories(collection.id)}
                              </VerticalStack>
                            )
                        )}
                    </VerticalStack>
                  ) : (
                    <div style={{ height: "50px", width: "50px" }}>
                      <Modal
                        open={collections.length == 0}
                        loading
                        small
                      ></Modal>
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
                  )}
                </LegacyCard.Section>
              </LegacyCard>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 6, xl: 6 }}>
              <LegacyCard title="CSE">
                <LegacyCard.Section>
                  {entreprises.length > 0 ? (
                    <VerticalStack>
                      <VerticalStack key="1">
                        <Checkbox
                          label="TOUTES LES CSE"
                          checked={selectedEntreprises.length === 0}
                          onChange={() => handleSelectionEntreprises(1)} // Désélectionne tout
                        />
                      </VerticalStack>
                      {entreprises.map((entreprise) => (
                        <VerticalStack key={entreprise.code_cse.value}>
                          <Checkbox
                            label={entreprise.company.value}
                            checked={selectedEntreprises.includes(
                              entreprise.code_cse.value
                            )}
                            onChange={() =>
                              handleSelectionEntreprises(
                                entreprise.code_cse.value
                              )
                            }
                          />
                        </VerticalStack>
                      ))}
                    </VerticalStack>
                  ) : (
                    <div style={{ height: "50px", width: "50px" }}>
                      <Modal
                        open={entreprises.length == 0}
                        loading
                        small
                      ></Modal>

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
                  )}
                </LegacyCard.Section>
              </LegacyCard>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}>
              <PolarisVizProvider>
                <div
                  style={{
                    height: 500,
                  }}
                >
                  <BarChart
                    xAxisOptions={{
                      labelFormatter: (value) => {
                        return `${new Date(value).toLocaleDateString("fr-FR", {
                          dateStyle: "medium",
                        })}`;
                      },
                    }}
                    data={[
                      {
                        name: "Ventes Totales Produits",
                        data: stats.sales,
                      },
                    ]}
                    theme="Light"
                  />
                </div>
              </PolarisVizProvider>
            </Grid.Cell>
          </Grid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}