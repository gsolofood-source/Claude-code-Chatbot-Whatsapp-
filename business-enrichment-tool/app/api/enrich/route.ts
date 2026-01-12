import { NextRequest } from 'next/server';
import { enrichCompany } from '@/lib/web-scraper';
import { delay } from '@/lib/utils';
import type { Company, EnrichmentProgress, EnrichmentOptions } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companies, options } = body as {
      companies: Company[];
      options?: EnrichmentOptions;
    };

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nessuna azienda da elaborare' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create SSE stream
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process companies in background
    (async () => {
      try {
        for (let i = 0; i < companies.length; i++) {
          const company = companies[i];

          // Send "searching" status
          const searchingEvent: EnrichmentProgress = {
            companyId: company.id,
            companyName: company.name,
            status: 'searching',
          };

          await writer.write(
            encoder.encode(`data: ${JSON.stringify(searchingEvent)}\n\n`)
          );

          try {
            // Perform enrichment
            const enrichmentResult = await enrichCompany(
              company.name,
              company.city,
              company.address,
              company.existingWebsite,
              {
                searchInstagram: options?.searchInstagram ?? true,
                searchWebsite: options?.searchWebsite ?? true,
                searchGoogleMaps: options?.searchGoogleMaps ?? true,
                delayMs: options?.delayBetweenRequests ?? 1500,
              }
            );

            // Determine status
            const hasAnyResult =
              enrichmentResult.instagram?.url ||
              enrichmentResult.website?.url ||
              enrichmentResult.googleMaps?.url;

            const foundEvent: EnrichmentProgress = {
              companyId: company.id,
              companyName: company.name,
              status: hasAnyResult ? 'found' : 'not_found',
              instagram: enrichmentResult.instagram
                ? {
                    url: enrichmentResult.instagram.url,
                    handle: enrichmentResult.instagram.handle,
                    found: !!enrichmentResult.instagram.url,
                  }
                : { found: false },
              website: enrichmentResult.website
                ? {
                    url: enrichmentResult.website.url,
                    found: !!enrichmentResult.website.url,
                  }
                : { found: false },
              googleMaps: enrichmentResult.googleMaps
                ? {
                    url: enrichmentResult.googleMaps.url,
                    found: !!enrichmentResult.googleMaps.url,
                  }
                : { found: false },
            };

            await writer.write(
              encoder.encode(`data: ${JSON.stringify(foundEvent)}\n\n`)
            );
          } catch (error) {
            // Send error status for this company
            const errorEvent: EnrichmentProgress = {
              companyId: company.id,
              companyName: company.name,
              status: 'error',
              error: error instanceof Error ? error.message : 'Errore sconosciuto',
            };

            await writer.write(
              encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
            );
          }

          // Add delay between companies to avoid rate limiting
          if (i < companies.length - 1) {
            await delay(options?.delayBetweenRequests ?? 1500);
          }
        }

        // Send completion event
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`)
        );
      } catch (error) {
        console.error('Enrichment stream error:', error);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Errore sconosciuto',
            })}\n\n`
          )
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Enrich error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante l\'enrichment',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
