import {
  Page,
  Text,
  Link,
  Frame,
  Badge,
  Layout,
  Loading,
  LegacyCard,
  IndexTable,
  EmptySearchResult,
  useIndexResourceState,
  Thumbnail,
  Modal,
  Grid,
  Tooltip,
  Button,
  Icon,
  IndexFilters,
  useSetIndexFiltersMode,
  ChoiceList,
} from "@shopify/polaris";
import { ImageMajor, ExportMinor } from "@shopify/polaris-icons";
import { useState, useEffect, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from '@shopify/app-bridge/actions';
import { utils, writeFileXLSX } from "xlsx";
export { utils, writeFileXLSX };

export default function CsePage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const [isLoading, setIsLoading] = useState(true);
  const [coops, setCoop] = useState([]);
  const [filteredCoops, setFilteredCoops] = useState([]);
  const [entreprises, setEntreprises] = useState([]);

  const resourceName = {singular: "Coop", plural: "Coops"};

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(filteredCoops);
  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucune Coop trouvé"}
      description={
        "Essayez de modifier les filtres ou les termes de recherche"
      }
      withIllustration
    />
  );

  const rowMarkup = filteredCoops.map(
    (
      {
        id,
        code_cse,
        address,
        phone,
        city,
        zip,
        cse_name,
        email,
        image,
        password,
      },
      index
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Thumbnail
            source={image.value ? image.value : ImageMajor}
            alt={cse_name.value}
            size="small"
          />
        </IndexTable.Cell>
        <IndexTable.Cell>{code_cse?.value}</IndexTable.Cell>
        <IndexTable.Cell>{cse_name?.value}</IndexTable.Cell>
        <IndexTable.Cell>{email?.value} </IndexTable.Cell>
        <IndexTable.Cell>{phone?.value} </IndexTable.Cell>
        <IndexTable.Cell>
          <button
            onClick={async () => {
              await fetch(
                `https://staging.api.creuch.fr/api/check_entreprise`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    code_cse: code_cse?.value,
                  }),
                  headers: {
                    "Content-type": "application/json",
                  },
                }
              )
                .then((response) => response.json())
                .then((data) => {
                  console.log("oco", data);
                  if (data?.data?.metaobjects?.edges?.length > 0) {
                    if (
                      data?.data?.metaobjects?.edges[0]?.node?.password?.value ===
                      password?.value
                    ) {
                      localStorage.setItem(
                        "user",
                        JSON.stringify(data?.data?.metaobjects?.edges[0]?.node)
                      );
                      console.log(
                        "connected",
                        data?.data?.metaobjects?.edges[0]?.node
                      );
                      ///redirect.dispatch(Redirect.Action.APP, "/dashboard");
                      redirect.dispatch(
                        Redirect.Action.ADMIN_PATH,
                        "/apps/creuch_business/dashboard"
                      );
                    } else {
                      console.log("Mot de passe incorrect");
                    }
                  } else {
                    console.log("Code CSE incorrect");
                  }
                })
                .catch((error) => {
                  // console.log(error.message);
                });
            }}
          >
            Connexion
          </button>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const exportToExcel = async () => {
    const tableau = coops.map((coop, index) => {
      return {
        Image: coop.image ? coop.image.value : "Aucun",
        Code: coop.code_cse?.value,
        Nom: coop.cse_name?.value,
        Email: coop.email?.value,
        Téléphone: coop.phone?.value,
      };
    });
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(tableau);
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFileXLSX(wb, "Liste CSE.xlsx");
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const [itemStrings, setItemStrings] = useState(["Toutes"]);
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
    { label: "Code", value: "code_cse asc", directionLabel: "A-Z" },
    { label: "Code", value: "code_cse desc", directionLabel: "Z-A" },
    { label: "Nom", value: "cse_name asc", directionLabel: "A-Z" },
    { label: "Nom", value: "cse_name desc", directionLabel: "Z-A" },
    { label: "Email", value: "email asc", directionLabel: "A-Z" },
    { label: "Email", value: "email desc", directionLabel: "Z-A" },
    { label: "Téléphone", value: "phone asc", directionLabel: "A-Z" },
    { label: "Téléphone", value: "phone desc", directionLabel: "Z-A" }
  ];

  const [sortSelected, setSortSelected] = useState(["code_cse asc"]);
  const handleSortSelected = useCallback(
    (value) => {
      setSortSelected(value);
      const [sortKey, sortDirection] = value[0].split(" ");
      const sortedCoops = [...filteredCoops];

      switch (sortKey) {
        case "code_cse":
          sortedCoops.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.code_cse?.value.localeCompare(b.code_cse?.value);
            } else {
              return b.code_cse?.value.localeCompare(a.code_cse?.value);
            }
          });
          break;
        case "cse_name":
          sortedCoops.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.cse_name.value.localeCompare(b.cse_name.value);
            } else {
              return b.cse_name.value.localeCompare(a.cse_name.value);
            }
          });
          break;
        case "email":
          sortedCoops.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.email.value.localeCompare(b.email.value);
            } else {
              return b.email.value.localeCompare(a.email.value);
            }
          });
          break;
        case "phone":
          sortedCoops.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.phone.value.localeCompare(b.phone.value);
            } else {
              return b.phone.value.localeCompare(a.phone.value);
            }
          });
          break;
        default:
          break;
      }
      setFilteredCoops(sortedCoops);
    },
    [filteredCoops]
  );

  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => {
    setQueryValue("");
    setFilteredCoops(coops);
  };

  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction =
    selected === 0
      ? {
          type: "save-as",
          onAction: onCreateNewView,
          disabled: false,
          loading: false,
        }
      : {
          type: "save",
          onAction: onHandleSave,
          disabled: false,
          loading: false,
        };

  const [queryValue, setQueryValue] = useState("");
  const [cse, setCse] = useState([]);

  const handleCseChange = useCallback(
    (value) => {
      setCse(value);
      const filteredCoops = coops.filter((coop) => {
        if (value.length === 0) {
          return true;
        }
        return value.includes(String(coop.code_cse?.value));
      });

      setFilteredCoops(filteredCoops);
    },
    [coops, filteredCoops]
  );

  const handleCseRemove = useCallback(() => {
    setCse([]);
    setFilteredCoops(coops);
  }, [coops]);

  const handleFiltersQueryChange = useCallback(
    (value) => {
      setQueryValue(value);
      const searchValueLower = value.toLowerCase();

      if (searchValueLower === "") {
        setFilteredCoops(coops);
      } else {
        const filteredCoops = coops.filter((coop) => {
          const code_cse = String(coop.code_cse?.value).toLowerCase();
          const cse_name = String(coop.cse_name?.value).toLowerCase();
          const email = String(coop.email?.value).toLowerCase();
          const phone = String(coop.phone?.value).toLowerCase();

          return (
            code_cse.includes(searchValueLower) ||
            cse_name.includes(searchValueLower) ||
            email.includes(searchValueLower) ||
            phone.includes(searchValueLower)
          );
        });

        setFilteredCoops(filteredCoops);
      }
    },
    [coops]
  );

  const handleFiltersQueryClear = useCallback(() => {
    setQueryValue("");
    var filteredCoops = coops;
    if (cse.length >= 1) {
      filteredCoops = filteredCoops.filter((coop) => {
        if (cse.length === 0) {
          return true;
        }
        return cse.includes(String(coop.code_cse?.value));
      });
    }
    setFilteredCoops(filteredCoops);
  }, [coops]);

  const filters = [
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
                label: entreprise.cse_name?.value,
                value: entreprise.code_cse?.value,
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
      entrepriseLabels[entreprise.code_cse?.value] = entreprise.cse_name?.value;
    });

    switch (key) {
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
      return value === "" || value == null;
    }
  }

  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);

  const handleFiltersClearAll = useCallback(() => {
    handleQueryValueRemove();
    handleCseRemove();
  }, [handleQueryValueRemove, handleCseRemove]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetch("https://staging.api.creuch.fr/api/entreprises", {
        method: "GET",
        headers: { "Content-type": "application/json" },
      })
        .then((response) => response.json())
        .then((object) => {
          console.log("Coops", object);
          setCoop(object);
          setFilteredCoops(object);
          setEntreprises(object);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err.message);
        });
    };

    fetchData();
  }, []);

  return (
    <Page
      fullWidth
      backAction={{ content: "Tableau de bord", url: "/" }}
      title="Liste des CSE"
      titleMetadata={<Badge status="success">{coops.length} CSE</Badge>}
      subtitle="Gérez les CSE"
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
              itemCount={filteredCoops.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              emptyState={emptyStateMarkup}
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "" },
                { title: "Code" },
                { title: "Nom" },
                { title: "Email" },
                { title: "Téléphone" },
                { title: "Compte" },
              ]}
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
