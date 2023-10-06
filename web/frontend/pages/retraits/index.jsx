import {
  Modal,
  Link,
  Text,
  Thumbnail,
  Page,
  Frame,
  Badge,
  Layout,
  Loading,
  LegacyCard,
  IndexTable,
  EmptySearchResult,
  useIndexResourceState,
} from "@shopify/polaris";
import { ImageMajor } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from '@shopify/app-bridge/actions';

export default function HomePage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const [retraits, setRetraits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetch(
        "https://staging.api.creuch.fr/api/emplacements",
        {
          method: "GET",
          headers: {
            "Content-type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          setRetraits(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err.message);
        });
    };

    fetchData();
  }, []);

  const resourceName = {
    singular: "Point de retrait",
    plural: "Points de retrait",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(retraits);
  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucun point de retrait trouvés"}
      description={
        "Essayez de modifier les filtres ou les termes de recherche"
      }
      withIllustration
    />
  );

  const rowMarkup = retraits.map(({ id, name, address, isActive }, index) => (
    <IndexTable.Row
      id={id}
      key={id}
      selected={selectedResources.includes(id)}
      position={index}
    >
      <IndexTable.Cell>
        <Link
          dataPrimaryLink
          url={`/retraits/${id.match(/\/(\d+)$/)[1]}`}
          monochrome
          removeUnderline
        >
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {name}
          </Text>
        </Link>
      </IndexTable.Cell>
      <IndexTable.Cell>{address.address1}</IndexTable.Cell>
      <IndexTable.Cell>{address.city}</IndexTable.Cell>
      <IndexTable.Cell>{address.country}</IndexTable.Cell>
      <IndexTable.Cell>
        {isActive ? (
          <Badge progress="authorized" status="success">
            Actif
          </Badge>
        ) : (
          <Badge progress="incomplete" status="attention">
            Inactif
          </Badge>
        )}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

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
    <Page
      fullWidth
      backAction={{ content: "Tableau de bord", url: "/dashboard" }}
      title="Points de retrait/TOTEMS"
      titleMetadata={
        <Badge status="success">{retraits.length} Points de retrait</Badge>
      }
      subtitle="Gérez les points de retrait/TOTEM"
      compactTitle
/*       secondaryActions={[
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
    >
      <div>
        <Modal open={isLoading} loading small></Modal>
      </div>
      <Layout>
        <Layout.Section>
          <LegacyCard>
            <IndexTable
              resourceName={resourceName}
              itemCount={retraits.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              emptyState={emptyStateMarkup}
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Titre" },
                { title: "Adresse" },
                { title: "Ville" },
                { title: "Pays" },
                { title: "Statut" },
              ]}
              onNavigation
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
